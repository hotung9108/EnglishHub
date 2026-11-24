import gzip
import logging
import random
from collections.abc import AsyncIterator, Callable, Iterable, Iterator
from itertools import chain, repeat

import httpx
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.v1.endpoints import writing
from app.core.config import settings
from app.main import app


STORAGE_URL = "https://storage.example.test/essay.pdf?test-query=hidden"
CHUNK = b"x" * 65_536
LIMIT_CHUNKS = writing.MAX_DOCUMENT_BYTES // len(CHUNK)
TOO_LARGE_MESSAGE = "Dung lượng tài liệu vượt quá giới hạn 10 MiB."


class RecordingStream(httpx.AsyncByteStream):
    def __init__(
        self, chunks: Iterable[bytes], error: httpx.RequestError | None = None,
    ) -> None:
        self.chunks = chunks
        self.error = error
        self.chunks_read = 0
        self.closed = False

    async def __aiter__(self) -> AsyncIterator[bytes]:
        for chunk in self.chunks:
            self.chunks_read += 1
            yield chunk
        if self.error is not None:
            raise self.error

    async def aclose(self) -> None:
        self.closed = True


def use_transport(
    monkeypatch: pytest.MonkeyPatch,
    handler: Callable[[httpx.Request], httpx.Response],
) -> None:
    client_class = httpx.AsyncClient
    transport = httpx.MockTransport(handler)

    def create_client(*args: object, **kwargs: object) -> httpx.AsyncClient:
        return client_class(*args, transport=transport, **kwargs)

    monkeypatch.setattr(writing.httpx, "AsyncClient", create_client)


def serve_stream(
    monkeypatch: pytest.MonkeyPatch,
    stream: RecordingStream,
    headers: dict[str, str] | None = None,
    status_code: int = 200,
) -> None:
    def handle(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, headers=headers, stream=stream, request=request)

    use_transport(monkeypatch, handle)


def track_buffer_sizes(monkeypatch: pytest.MonkeyPatch) -> list[int]:
    sizes: list[int] = []

    class TrackedBuffer(bytearray):
        def extend(self, data: bytes) -> None:
            super().extend(data)
            sizes.append(len(self))

    monkeypatch.setattr(writing, "bytearray", TrackedBuffer, raising=False)
    return sizes


@pytest.fixture
def writing_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("INTERNAL_SECRET", "test-internal-secret")
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    with TestClient(app, headers={"X-Internal-Secret": "test-internal-secret"}) as client:
        yield client


@pytest.mark.asyncio
@pytest.mark.parametrize("chunk_count", [0, 1, LIMIT_CHUNKS], ids=["empty", "below", "exact"])
async def test_download_accepts_document_up_to_limit(
    chunk_count: int, monkeypatch: pytest.MonkeyPatch,
) -> None:
    assert LIMIT_CHUNKS == 160
    stream = RecordingStream(repeat(CHUNK, chunk_count))
    serve_stream(monkeypatch, stream)

    result = await writing._download_document(STORAGE_URL)

    assert len(result) == chunk_count * len(CHUNK)
    assert result.count(b"x") == len(result)
    assert stream.chunks_read == chunk_count
    assert stream.closed


@pytest.mark.asyncio
@pytest.mark.parametrize("content_length", [None, "1"], ids=["missing", "too_small"])
async def test_download_stops_before_appending_oversized_chunk(
    content_length: str | None, monkeypatch: pytest.MonkeyPatch,
) -> None:
    """MockTransport tests counting bytes from HTTPX, not HTTP wire framing."""
    sizes = track_buffer_sizes(monkeypatch)
    stream = RecordingStream(chain(repeat(CHUNK, LIMIT_CHUNKS), [b"x", b"unread"]))
    headers = {} if content_length is None else {"Content-Length": content_length}
    serve_stream(monkeypatch, stream, headers)

    with pytest.raises(writing.DocumentTooLargeException) as error:
        await writing._download_document(STORAGE_URL)

    assert error.value.status_code == 413
    assert error.value.code == "DOCUMENT_TOO_LARGE"
    assert error.value.message == TOO_LARGE_MESSAGE
    assert stream.chunks_read == LIMIT_CHUNKS + 1
    assert stream.closed
    assert sizes
    assert sizes[-1] == writing.MAX_DOCUMENT_BYTES
    assert max(sizes) == writing.MAX_DOCUMENT_BYTES


@pytest.mark.asyncio
@pytest.mark.parametrize("encoding", [None, "identity", "IDENTITY", "  identity  "])
async def test_download_rejects_large_uncompressed_header_without_reading(
    encoding: str | None, monkeypatch: pytest.MonkeyPatch,
) -> None:
    stream = RecordingStream([CHUNK])
    headers = {"Content-Length": str(writing.MAX_DOCUMENT_BYTES + 1)}
    if encoding is not None:
        headers["Content-Encoding"] = encoding
    serve_stream(monkeypatch, stream, headers)

    with pytest.raises(writing.DocumentTooLargeException):
        await writing._download_document(STORAGE_URL)

    assert stream.chunks_read == 0
    assert stream.closed


@pytest.mark.asyncio
@pytest.mark.parametrize("encoding", ["gzip", "GZIP", "gzip, identity", "unknown", ""])
async def test_download_ignores_large_length_for_other_encodings(
    encoding: str, monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = b"small document"
    encoded = gzip.compress(payload) if "gzip" in encoding.lower() else payload
    stream = RecordingStream([encoded])
    serve_stream(monkeypatch, stream, {
        "Content-Encoding": encoding,
        "Content-Length": str(writing.MAX_DOCUMENT_BYTES + 1),
    })

    result = await writing._download_document(STORAGE_URL)

    assert result == payload
    assert stream.chunks_read == 1
    assert stream.closed


@pytest.mark.asyncio
@pytest.mark.parametrize("content_length", ["invalid", "-1", ""])
@pytest.mark.parametrize("oversized", [False, True], ids=["small", "oversized"])
async def test_download_ignores_invalid_content_length(
    content_length: str, oversized: bool, monkeypatch: pytest.MonkeyPatch,
) -> None:
    chunks = chain(repeat(CHUNK, LIMIT_CHUNKS), [b"x"]) if oversized else [CHUNK]
    stream = RecordingStream(chunks)
    serve_stream(monkeypatch, stream, {"Content-Length": content_length})

    if oversized:
        with pytest.raises(writing.DocumentTooLargeException):
            await writing._download_document(STORAGE_URL)
    else:
        assert await writing._download_document(STORAGE_URL) == CHUNK
    assert stream.closed


@pytest.mark.asyncio
async def test_download_accepts_gzip_at_limit_with_larger_encoded_length(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = random.Random(0).randbytes(writing.MAX_DOCUMENT_BYTES)
    encoded = gzip.compress(payload, mtime=0)
    assert len(encoded) > writing.MAX_DOCUMENT_BYTES
    stream = RecordingStream([encoded])
    serve_stream(monkeypatch, stream, {
        "Content-Encoding": "gzip",
        "Content-Length": str(len(encoded)),
    })

    assert await writing._download_document(STORAGE_URL) == payload
    assert stream.chunks_read == 1
    assert stream.closed


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("decoded_size", "content_length"),
    [
        (writing.MAX_DOCUMENT_BYTES + 1, None),
        (writing.MAX_DOCUMENT_BYTES + 1, "1"),
        (2 * writing.MAX_DOCUMENT_BYTES, None),
    ],
    ids=["one_byte_over", "length_too_small", "compressed_bomb"],
)
async def test_download_rejects_oversized_gzip_without_overfilling_buffer(
    decoded_size: int, content_length: str | None, monkeypatch: pytest.MonkeyPatch,
) -> None:
    """MockTransport tests counting bytes from HTTPX, not HTTP wire framing."""
    sizes = track_buffer_sizes(monkeypatch)
    encoded = gzip.compress(b"x" * decoded_size, mtime=0)
    assert len(encoded) < writing.MAX_DOCUMENT_BYTES
    split_at = len(encoded) // 4
    stream = RecordingStream([encoded[:split_at], encoded[split_at:], b"unread"])
    headers = {"Content-Encoding": "gzip"}
    if content_length is not None:
        headers["Content-Length"] = content_length
    serve_stream(monkeypatch, stream, headers)

    with pytest.raises(writing.DocumentTooLargeException) as error:
        await writing._download_document(STORAGE_URL)

    assert error.value.status_code == 413
    assert error.value.code == "DOCUMENT_TOO_LARGE"
    assert stream.chunks_read == 2
    assert stream.closed
    assert sizes
    assert max(sizes) <= writing.MAX_DOCUMENT_BYTES


@pytest.mark.parametrize(
    ("mock_mode", "mock_provider"),
    [(True, False), (False, False), (False, True)],
    ids=["mock_mode", "no_mock", "mock_provider"],
)
def test_writing_route_preserves_413_in_mock_modes(
    mock_mode: bool,
    mock_provider: bool,
    writing_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", mock_mode)
    stream = RecordingStream([CHUNK])
    serve_stream(monkeypatch, stream, {"Content-Length": str(writing.MAX_DOCUMENT_BYTES + 1)})
    request_data: dict[str, object] = {"submissionModuleId": 15, "documentUrl": STORAGE_URL}
    if mock_provider:
        request_data["aiProvider"] = "mock"

    with caplog.at_level(logging.INFO):
        response = writing_client.post("/api/v1/analyze/writing", json=request_data)

    assert response.status_code == 413
    assert response.json()["code"] == "DOCUMENT_TOO_LARGE"
    assert response.json()["message"] == TOO_LARGE_MESSAGE
    assert stream.chunks_read == 0
    assert stream.closed
    assert STORAGE_URL not in caplog.text
    assert "test-query=hidden" not in caplog.text
    assert CHUNK.decode("ascii") not in caplog.text


@pytest.mark.asyncio
@pytest.mark.parametrize("error_type", ["connect", "read", "timeout"])
async def test_download_maps_connection_errors_to_502(
    error_type: str, monkeypatch: pytest.MonkeyPatch,
) -> None:
    errors = {"read": httpx.ReadError("read error"), "timeout": httpx.ReadTimeout("timeout")}
    stream = RecordingStream([CHUNK], error=errors.get(error_type))

    def handle(request: httpx.Request) -> httpx.Response:
        if error_type == "connect":
            raise httpx.ConnectError("connection error", request=request)
        return httpx.Response(200, stream=stream, request=request)

    use_transport(monkeypatch, handle)
    with pytest.raises(HTTPException) as error:
        await writing._download_document(STORAGE_URL)

    assert error.value.status_code == 502
    if error_type != "connect":
        assert stream.chunks_read == 1
        assert stream.closed


@pytest.mark.asyncio
@pytest.mark.parametrize("storage_status", [404, 500])
async def test_download_checks_storage_status_before_body(
    storage_status: int, monkeypatch: pytest.MonkeyPatch,
) -> None:
    stream = RecordingStream([CHUNK])
    serve_stream(
        monkeypatch, stream,
        {"Content-Length": str(writing.MAX_DOCUMENT_BYTES + 1)}, storage_status,
    )

    with pytest.raises(HTTPException) as error:
        await writing._download_document(STORAGE_URL)

    assert error.value.status_code == 404
    assert stream.chunks_read == 0
    assert stream.closed


@pytest.mark.asyncio
async def test_download_keeps_30_second_timeout(monkeypatch: pytest.MonkeyPatch) -> None:
    stream = RecordingStream([CHUNK])
    timeouts: list[dict[str, float]] = []

    def handle(request: httpx.Request) -> httpx.Response:
        timeouts.append(request.extensions["timeout"])
        return httpx.Response(200, stream=stream, request=request)

    use_transport(monkeypatch, handle)
    assert await writing._download_document(STORAGE_URL) == CHUNK
    assert timeouts == [{"connect": 30.0, "read": 30.0, "write": 30.0, "pool": 30.0}]
    assert stream.closed


@pytest.mark.asyncio
@pytest.mark.parametrize("final_too_large", [False, True])
async def test_download_applies_limit_to_final_redirect_response(
    final_too_large: bool, monkeypatch: pytest.MonkeyPatch,
) -> None:
    redirect_stream = RecordingStream([])
    final_stream = RecordingStream([CHUNK])
    paths: list[str] = []

    def handle(request: httpx.Request) -> httpx.Response:
        paths.append(request.url.path)
        if len(paths) == 1:
            return httpx.Response(302, headers={
                "Location": "/final.pdf",
                "Content-Length": str(writing.MAX_DOCUMENT_BYTES + 1),
            }, stream=redirect_stream, request=request)
        headers = {"Content-Length": str(writing.MAX_DOCUMENT_BYTES + 1)} if final_too_large else {}
        return httpx.Response(200, headers=headers, stream=final_stream, request=request)

    use_transport(monkeypatch, handle)
    if final_too_large:
        with pytest.raises(writing.DocumentTooLargeException):
            await writing._download_document(STORAGE_URL)
        assert final_stream.chunks_read == 0
    else:
        assert await writing._download_document(STORAGE_URL) == CHUNK
        assert final_stream.chunks_read == 1
    assert paths == ["/essay.pdf", "/final.pdf"]
    assert redirect_stream.closed
    assert final_stream.closed
