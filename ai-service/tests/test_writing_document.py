import builtins
import logging
import traceback
from collections.abc import Iterator
from io import BytesIO
from pathlib import Path
from textwrap import wrap
from unittest.mock import AsyncMock

import docx
import pypdf
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.v1.endpoints import writing
from app.core.config import settings
from app.main import app
from app.services.text_analyzer import TextAnalyzer


BENCHMARK_PATH = Path(__file__).parent / "benchmark_data" / "writing_qa21_essay.txt"
SAMPLE_WORD_COUNT = 30
SUBMISSION_MODULE_ID = 15
STORAGE_URL = "https://storage.example.com/submissions"
PRESIGNED_QUERY = "?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=900"
INVALID_BYTES = b"\x00\x01\x02"


def make_docx(paragraphs: list[str]) -> bytes:
    document = docx.Document()
    for paragraph in paragraphs:
        document.add_paragraph(paragraph)
    output = BytesIO()
    document.save(output)
    return output.getvalue()


def make_pdf(pages: list[str]) -> bytes:
    page_ids = [4 + 2 * index for index in range(len(pages))]
    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode("ascii"),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    for page_id, page_text in zip(page_ids, pages):
        content_id = page_id + 1
        page = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 3 0 R >> >> /Contents {content_id} 0 R >>"
        )
        objects.append(page.encode("ascii"))

        commands = ["BT /F1 12 Tf 40 740 Td 14 TL"]
        for line in wrap(page_text, width=70):
            escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            commands.append(f"({escaped}) Tj T*")
        commands.append("ET")
        content = "\n".join(commands).encode("ascii")
        objects.append(
            b"<< /Length " + str(len(content)).encode("ascii")
            + b" >>\nstream\n" + content + b"\nendstream"
        )

    output = BytesIO()
    output.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for index, obj in enumerate(objects, start=1):
        offsets.append(output.tell())
        output.write(f"{index} 0 obj\n".encode("ascii"))
        output.write(obj + b"\nendobj\n")

    xref_offset = output.tell()
    output.write(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.write(b"0000000000 65535 f \n")
    for offset in offsets:
        output.write(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.write(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n".encode("ascii")
    )
    return output.getvalue()


def make_image_only_pdf() -> bytes:
    writer = pypdf.PdfWriter()
    page = writer.add_blank_page(width=100, height=100)
    image = pypdf.generic.DecodedStreamObject()
    image.set_data(
        b"q\n100 0 0 100 0 0 cm\nBI /W 1 /H 1 /BPC 8 /CS /G ID\n\x80\nEI\nQ\n"
    )
    page[pypdf.generic.NameObject("/Contents")] = writer._add_object(image)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def make_docx_with_table(text: str) -> bytes:
    document = docx.Document()
    table = document.add_table(rows=1, cols=1)
    table.cell(0, 0).text = text
    output = BytesIO()
    document.save(output)
    return output.getvalue()


def encrypt_pdf(pdf_bytes: bytes, user_password: str, owner_password: str) -> bytes:
    reader = pypdf.PdfReader(BytesIO(pdf_bytes))
    writer = pypdf.PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt(
        user_password=user_password,
        owner_password=owner_password,
        algorithm="RC4-128",
    )
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def assert_sample_text(actual: str, expected: str) -> None:
    assert actual.split() == expected.split()
    assert len(actual.split()) == SAMPLE_WORD_COUNT


@pytest.fixture(scope="module")
def sample_text() -> str:
    words = BENCHMARK_PATH.read_text(encoding="utf-8").split()
    assert len(words) >= SAMPLE_WORD_COUNT
    return " ".join(words[:SAMPLE_WORD_COUNT])


@pytest.fixture(scope="module")
def documents(sample_text: str) -> dict[str, bytes]:
    return {
        "pdf": make_pdf([sample_text]),
        "docx": make_docx([sample_text]),
    }


@pytest.fixture(scope="module")
def empty_documents(sample_text: str) -> dict[str, bytes]:
    return {
        "pdf_blank": make_pdf([""]),
        "pdf_blank_pages": make_pdf(["", "", ""]),
        "pdf_image": make_image_only_pdf(),
        "docx_blank": make_docx([]),
        "docx_whitespace": make_docx([" \t \n  "]),
        "docx_table": make_docx_with_table(sample_text),
    }


@pytest.fixture
def writing_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("INTERNAL_SECRET", "test-internal-secret")
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    with TestClient(app, headers={"X-Internal-Secret": "test-internal-secret"}) as client:
        yield client


@pytest.mark.parametrize("document_type", ["pdf", "docx"])
def test_extract_valid_document(
    document_type: str, documents: dict[str, bytes], sample_text: str,
) -> None:
    extracted = TextAnalyzer.extract_text_from_document(
        documents[document_type], f"essay.{document_type}"
    )
    assert_sample_text(extracted, sample_text)


def test_extract_pdf_with_blank_page_between_text_pages(sample_text: str) -> None:
    words = sample_text.split()
    pdf_bytes = make_pdf([" ".join(words[:15]), "", " ".join(words[15:])])
    reader = pypdf.PdfReader(BytesIO(pdf_bytes))
    assert len(reader.pages) == 3
    assert not (reader.pages[1].extract_text() or "").strip()

    extracted = TextAnalyzer.extract_text_from_document(pdf_bytes, "essay.pdf")
    assert_sample_text(extracted, sample_text)


def test_extract_docx_with_empty_paragraph_between_text_paragraphs(sample_text: str) -> None:
    words = sample_text.split()
    first = " ".join(words[:15])
    second = " ".join(words[15:])
    document = make_docx([first, "", second])

    extracted = TextAnalyzer.extract_text_from_document(document, "essay.docx")
    assert extracted == f"{first}\n{second}"
    assert_sample_text(extracted, sample_text)


@pytest.mark.parametrize(
    ("filename", "payload_type"),
    [
        ("essay.pdf", "corrupt"),
        ("essay.docx", "corrupt"),
        ("essay.pdf", "docx"),
        ("essay.docx", "pdf"),
        ("essay.pdf", "empty"),
        ("essay.docx", "empty"),
    ],
)
def test_extract_invalid_or_empty_document(
    filename: str, payload_type: str, documents: dict[str, bytes],
) -> None:
    payloads = {"corrupt": INVALID_BYTES, "empty": b"", **documents}
    with pytest.raises(ValueError) as error:
        TextAnalyzer.extract_text_from_document(payloads[payload_type], filename)

    assert not isinstance(error.value, ModuleNotFoundError)
    assert not isinstance(error.value.__cause__, ModuleNotFoundError)
    assert not isinstance(error.value.__context__, ModuleNotFoundError)
    assert "No module named" not in str(error.value)


@pytest.mark.parametrize("has_user_password", [True, False])
def test_extract_encrypted_pdf(
    has_user_password: bool, documents: dict[str, bytes], sample_text: str,
) -> None:
    password = sample_text.split()[0]
    encrypted = encrypt_pdf(
        documents["pdf"], password if has_user_password else "", password
    )

    if has_user_password:
        with pytest.raises(ValueError) as error:
            TextAnalyzer.extract_text_from_document(encrypted, "essay.pdf")
        assert not isinstance(error.value.__context__, ModuleNotFoundError)
        assert "No module named" not in str(error.value)
    else:
        extracted = TextAnalyzer.extract_text_from_document(encrypted, "essay.pdf")
        assert_sample_text(extracted, sample_text)


@pytest.mark.parametrize(
    ("document_type", "filename"),
    [
        ("pdf", "essay.pdf"),
        ("docx", "essay.docx"),
        ("pdf", "essay.PDF"),
        ("docx", "essay.DOCX"),
    ],
)
def test_writing_route_extracts_document(
    document_type: str,
    filename: str,
    documents: dict[str, bytes],
    writing_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", True)
    download = AsyncMock(return_value=documents[document_type])
    monkeypatch.setattr(writing, "_download_document", download)
    url = f"{STORAGE_URL}/{filename}{PRESIGNED_QUERY}"

    response = writing_client.post(
        "/api/v1/analyze/writing",
        json={"submissionModuleId": SUBMISSION_MODULE_ID, "documentUrl": url},
    )

    assert response.status_code == 200
    assert response.json()["textMetrics"]["wordCount"] == SAMPLE_WORD_COUNT
    download.assert_awaited_once_with(url)


@pytest.mark.parametrize("document_type", ["pdf", "docx"])
@pytest.mark.parametrize("payload", [INVALID_BYTES, b""], ids=["corrupt", "empty"])
def test_writing_route_rejects_invalid_document_without_mock(
    document_type: str,
    payload: bytes,
    writing_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", False)
    download = AsyncMock(return_value=payload)
    monkeypatch.setattr(writing, "_download_document", download)
    url = f"{STORAGE_URL}/essay.{document_type}{PRESIGNED_QUERY}"

    response = writing_client.post(
        "/api/v1/analyze/writing",
        json={"submissionModuleId": SUBMISSION_MODULE_ID, "documentUrl": url},
    )

    assert response.status_code == 400
    body = response.json()
    assert body["code"] == "BAD_REQUEST"
    assert "No module named" not in body["message"]
    if not payload:
        assert "0 bytes" in body["message"]
    else:
        assert "Không thể đọc nội dung file" in body["message"]
    download.assert_awaited_once_with(url)


def test_writing_route_keeps_short_content_as_422(
    sample_text: str, writing_client: TestClient, monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", True)
    short_text = " ".join(sample_text.split()[:5])
    response = writing_client.post(
        "/api/v1/analyze/writing",
        json={"submissionModuleId": SUBMISSION_MODULE_ID, "content": short_text},
    )

    assert response.status_code == 422
    assert response.json()["code"] == "UNPROCESSABLE_ENTITY"


def test_writing_route_prefers_content_over_document_url(
    sample_text: str, writing_client: TestClient, monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", True)
    download = AsyncMock()
    monkeypatch.setattr(writing, "_download_document", download)

    response = writing_client.post(
        "/api/v1/analyze/writing",
        json={
            "submissionModuleId": SUBMISSION_MODULE_ID,
            "content": sample_text,
            "documentUrl": f"{STORAGE_URL}/essay.pdf{PRESIGNED_QUERY}",
        },
    )

    assert response.status_code == 200
    assert response.json()["textMetrics"]["wordCount"] == SAMPLE_WORD_COUNT
    download.assert_not_awaited()


@pytest.mark.parametrize(
    ("mock_mode", "mock_provider"),
    [(True, False), (False, False), (False, True)],
    ids=["mock_mode", "no_mock", "mock_provider"],
)
@pytest.mark.parametrize(
    ("case", "document_type"),
    [
        ("pdf_blank", "pdf"),
        ("pdf_blank_pages", "pdf"),
        ("pdf_image", "pdf"),
        ("docx_blank", "docx"),
        ("docx_whitespace", "docx"),
        ("docx_table", "docx"),
    ],
)
def test_writing_route_rejects_empty_extracted_text(
    case: str,
    document_type: str,
    mock_mode: bool,
    mock_provider: bool,
    empty_documents: dict[str, bytes],
    sample_text: str,
    writing_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    payload = empty_documents[case]
    filename = f"essay.{document_type}"
    assert not TextAnalyzer.extract_text_from_document(payload, filename).strip()
    if case == "pdf_image":
        page = pypdf.PdfReader(BytesIO(payload)).pages[0]
        assert b"BI /W 1 /H 1" in page.get_contents().get_data()
    if case == "docx_table":
        assert docx.Document(BytesIO(payload)).tables[0].cell(0, 0).text == sample_text

    monkeypatch.setattr(settings, "MOCK_MODE", mock_mode)
    download = AsyncMock(return_value=payload)
    monkeypatch.setattr(writing, "_download_document", download)
    url = f"{STORAGE_URL}/{filename}{PRESIGNED_QUERY}"
    request_data: dict[str, object] = {
        "submissionModuleId": SUBMISSION_MODULE_ID, "documentUrl": url,
    }
    if mock_provider:
        request_data["aiProvider"] = "mock"
    with caplog.at_level(logging.WARNING):
        response = writing_client.post("/api/v1/analyze/writing", json=request_data)

    assert response.status_code == 400
    body = response.json()
    assert body["code"] == "BAD_REQUEST"
    assert body["message"] == "Không trích xuất được văn bản từ tệp PDF/DOCX."
    assert "No module named" not in body["message"]
    assert "không có chữ" not in body["message"].lower()
    assert not [record for record in caplog.records if record.name == writing.logger.name]
    download.assert_awaited_once_with(url)


@pytest.mark.parametrize("document_type", ["pdf", "docx"])
@pytest.mark.parametrize("word_count", [19, 20])
def test_writing_route_document_word_count_boundary(
    document_type: str,
    word_count: int,
    sample_text: str,
    writing_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    text = " ".join(sample_text.split()[:word_count])
    payload = make_pdf([text]) if document_type == "pdf" else make_docx([text])
    monkeypatch.setattr(settings, "MOCK_MODE", True)
    monkeypatch.setattr(writing, "_download_document", AsyncMock(return_value=payload))
    with caplog.at_level(logging.WARNING):
        response = writing_client.post(
            "/api/v1/analyze/writing",
            json={
                "submissionModuleId": SUBMISSION_MODULE_ID,
                "documentUrl": f"{STORAGE_URL}/essay.{document_type}{PRESIGNED_QUERY}",
            },
        )

    if word_count == 19:
        assert response.status_code == 422
        assert response.json()["code"] == "UNPROCESSABLE_ENTITY"
        assert "19 từ" in response.json()["message"]
    else:
        assert response.status_code == 200
        assert response.json()["textMetrics"]["wordCount"] == word_count
    assert not [record for record in caplog.records if record.name == writing.logger.name]


@pytest.mark.parametrize("mock_mode", [True, False])
def test_writing_route_empty_json_content_still_returns_422(
    mock_mode: bool, writing_client: TestClient, monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", mock_mode)
    download = AsyncMock()
    monkeypatch.setattr(writing, "_download_document", download)
    response = writing_client.post(
        "/api/v1/analyze/writing",
        json={"submissionModuleId": SUBMISSION_MODULE_ID, "content": ""},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "UNPROCESSABLE_ENTITY"
    download.assert_not_awaited()


@pytest.mark.parametrize("mock_mode", [True, False])
@pytest.mark.parametrize("document_type", ["txt", "md"])
@pytest.mark.parametrize("payload", [b"", b" \t\n "], ids=["zero_bytes", "whitespace"])
def test_writing_route_empty_text_file_keeps_previous_behavior(
    mock_mode: bool,
    document_type: str,
    payload: bytes,
    writing_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", mock_mode)
    download = AsyncMock(return_value=payload)
    monkeypatch.setattr(writing, "_download_document", download)
    url = f"{STORAGE_URL}/essay.{document_type}{PRESIGNED_QUERY}"
    response = writing_client.post(
        "/api/v1/analyze/writing",
        json={"submissionModuleId": SUBMISSION_MODULE_ID, "documentUrl": url},
    )

    if not payload and not mock_mode:
        assert response.status_code == 400
        assert response.json()["code"] == "BAD_REQUEST"
        assert "0 bytes" in response.json()["message"]
    else:
        assert response.status_code == 422
        assert response.json()["code"] == "UNPROCESSABLE_ENTITY"
        if not payload:
            assert "12 từ" in response.json()["message"]
    download.assert_awaited_once_with(url)


@pytest.mark.parametrize(
    ("mock_mode", "mock_provider"),
    [(True, False), (False, False), (False, True)],
    ids=["mock_mode", "no_mock", "mock_provider"],
)
@pytest.mark.parametrize("document_type", ["pdf", "docx"])
@pytest.mark.parametrize("is_empty", [True, False], ids=["zero_bytes", "corrupt"])
def test_writing_route_parser_error_keeps_fallback_and_logs_safely(
    mock_mode: bool,
    mock_provider: bool,
    document_type: str,
    is_empty: bool,
    sample_text: str,
    writing_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    payload = b"" if is_empty else sample_text.encode("utf-8")
    filename = f"essay.{document_type}"
    if not is_empty:
        with pytest.raises(ValueError) as error:
            TextAnalyzer.extract_text_from_document(payload, filename)
        root_cause = error.value
        while root_cause.__cause__ or root_cause.__context__:
            root_cause = root_cause.__cause__ or root_cause.__context__
        cause_name = type(root_cause).__name__
        caplog.clear()

    monkeypatch.setattr(settings, "MOCK_MODE", mock_mode)
    download = AsyncMock(return_value=payload)
    monkeypatch.setattr(writing, "_download_document", download)
    url = f"{STORAGE_URL}/{filename}{PRESIGNED_QUERY}"
    request_data: dict[str, object] = {
        "submissionModuleId": SUBMISSION_MODULE_ID, "documentUrl": url,
    }
    if mock_provider:
        request_data["aiProvider"] = "mock"
    with caplog.at_level(logging.WARNING):
        response = writing_client.post("/api/v1/analyze/writing", json=request_data)

    if mock_mode or mock_provider:
        assert response.status_code == 422
        assert response.json()["code"] == "UNPROCESSABLE_ENTITY"
        assert "12 từ" in response.json()["message"]
    else:
        assert response.status_code == 400
        assert response.json()["code"] == "BAD_REQUEST"
        assert "No module named" not in response.json()["message"]

    warnings = [record for record in caplog.records if record.name == writing.logger.name]
    if is_empty:
        assert not warnings
    else:
        assert len(warnings) == 1
        assert warnings[0].levelno == logging.WARNING
        assert warnings[0].getMessage() == (
            f"Document parser failed: submissionModuleId={SUBMISSION_MODULE_ID}, "
            f"fileType={document_type}, cause={cause_name}"
        )
        assert warnings[0].exc_info is None
    assert url not in caplog.text
    assert PRESIGNED_QUERY not in caplog.text
    assert sample_text not in caplog.text
    download.assert_awaited_once_with(url)


@pytest.mark.parametrize("document_type", ["pdf", "docx"])
def test_parser_warning_does_not_expose_document_marker(
    document_type: str,
    writing_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    marker = "BE75MARKER42"
    payload = marker.encode("ascii") * 4
    with pytest.raises(Exception) as error:
        if document_type == "pdf":
            pypdf.PdfReader(BytesIO(payload))
        else:
            docx.Document(BytesIO(payload))
    cause_name = type(error.value).__name__
    caplog.clear()

    monkeypatch.setattr(settings, "MOCK_MODE", False)
    download = AsyncMock(return_value=payload)
    monkeypatch.setattr(writing, "_download_document", download)
    signature = "be75-test-signature"
    query = f"{PRESIGNED_QUERY}&X-Amz-Signature={signature}"
    url = f"{STORAGE_URL}/essay.{document_type}{query}"
    with caplog.at_level(logging.WARNING):
        response = writing_client.post(
            "/api/v1/analyze/writing",
            json={"submissionModuleId": SUBMISSION_MODULE_ID, "documentUrl": url},
        )

    library_records = [
        record for record in caplog.records
        if record.name.startswith(("pypdf", "docx"))
    ]
    library_log = "\n".join(logging.Formatter().format(record) for record in library_records)
    print(
        f"{document_type}: marker in response={marker in response.text}, "
        f"marker in library log={marker in library_log}"
    )

    assert response.status_code == 400
    assert response.json()["code"] == "BAD_REQUEST"
    warnings = [record for record in caplog.records if record.name == writing.logger.name]
    assert len(warnings) == 1
    warning = warnings[0]
    assert warning.levelno == logging.WARNING
    assert warning.getMessage() == (
        f"Document parser failed: submissionModuleId={SUBMISSION_MODULE_ID}, "
        f"fileType={document_type}, cause={cause_name}"
    )
    exception_text = "".join(traceback.format_exception(*warning.exc_info)) if warning.exc_info else ""
    for field in (str(warning.msg), warning.getMessage(), str(warning.args), exception_text):
        assert marker not in field
        assert url not in field
        assert query not in field
        assert signature not in field
    download.assert_awaited_once_with(url)


def test_writing_route_logs_missing_pdf_module_without_exposing_input(
    documents: dict[str, bytes],
    sample_text: str,
    writing_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    original_import = builtins.__import__

    def import_without_pypdf(name: str, *args: object, **kwargs: object) -> object:
        if name == "pypdf":
            raise ModuleNotFoundError("No module named 'pypdf'", name="pypdf")
        return original_import(name, *args, **kwargs)

    monkeypatch.setattr(settings, "MOCK_MODE", False)
    monkeypatch.setattr(builtins, "__import__", import_without_pypdf)
    download = AsyncMock(return_value=documents["pdf"])
    monkeypatch.setattr(writing, "_download_document", download)
    url = f"{STORAGE_URL}/essay.pdf{PRESIGNED_QUERY}"
    with caplog.at_level(logging.WARNING):
        response = writing_client.post(
            "/api/v1/analyze/writing",
            json={"submissionModuleId": SUBMISSION_MODULE_ID, "documentUrl": url},
        )

    assert response.status_code == 400
    assert response.json()["code"] == "BAD_REQUEST"
    assert "No module named" in response.json()["message"]
    warnings = [record for record in caplog.records if record.name == writing.logger.name]
    assert len(warnings) == 1
    assert warnings[0].levelno == logging.WARNING
    assert warnings[0].getMessage() == (
        f"Document parser failed: submissionModuleId={SUBMISSION_MODULE_ID}, "
        "fileType=pdf, cause=ModuleNotFoundError"
    )
    assert warnings[0].exc_info is None
    assert url not in caplog.text
    assert PRESIGNED_QUERY not in caplog.text
    assert sample_text not in caplog.text
    download.assert_awaited_once_with(url)


@pytest.mark.parametrize(
    ("mock_mode", "mock_provider"),
    [(True, False), (False, False), (False, True)],
    ids=["mock_mode", "no_mock", "mock_provider"],
)
@pytest.mark.parametrize("storage_status", [404, 502])
def test_writing_route_storage_errors_keep_previous_behavior(
    mock_mode: bool,
    mock_provider: bool,
    storage_status: int,
    writing_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", mock_mode)
    download = AsyncMock(side_effect=HTTPException(status_code=storage_status))
    monkeypatch.setattr(writing, "_download_document", download)
    url = f"{STORAGE_URL}/essay.pdf{PRESIGNED_QUERY}"
    request_data: dict[str, object] = {
        "submissionModuleId": SUBMISSION_MODULE_ID, "documentUrl": url,
    }
    if mock_provider:
        request_data["aiProvider"] = "mock"
    with caplog.at_level(logging.WARNING):
        response = writing_client.post("/api/v1/analyze/writing", json=request_data)

    if mock_mode or mock_provider:
        assert response.status_code == 422
        assert response.json()["code"] == "UNPROCESSABLE_ENTITY"
        assert "12 từ" in response.json()["message"]
    else:
        assert response.status_code == storage_status
        assert response.json()["code"] == ("NOT_FOUND" if storage_status == 404 else "HTTP_ERROR")
    assert not [record for record in caplog.records if record.name == writing.logger.name]
    download.assert_awaited_once_with(url)
