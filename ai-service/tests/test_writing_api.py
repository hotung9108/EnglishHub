try:
    import pytest
except ImportError:
    pytest = None
import os
from pathlib import Path
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.core.config import settings
from app.main import app
from app.services.gemini_service import GeminiService

os.environ.setdefault("INTERNAL_SECRET", "test-internal-secret")
settings.MOCK_MODE = True
INTERNAL_SECRET_HEADERS = {"X-Internal-Secret": os.environ.get("INTERNAL_SECRET", "test-internal-secret")}
client = TestClient(app, headers=INTERNAL_SECRET_HEADERS)

_benchmark_file = Path(__file__).parent / "benchmark_data" / "writing_qa21_essay.txt"
if _benchmark_file.exists():
    QA21_ESSAY = _benchmark_file.read_text(encoding="utf-8").strip()
else:
    QA21_ESSAY = (
        "Nowadays, many educators argue that unpaid community service should be compulsory in high school. "
        "In my opinion, I completely agree with this viewpoint because volunteering helps students develop essential life skills and broadens their social awareness.\n"
        "First of all, engaging in voluntary activities allows teenagers to acquire practical experience. "
        "Community service help teenagers understand social responsibilities and learn how to work effectively in a team. "
        "Furthermore, participating in social work can make a big benefit for their future university applications because admissions officers always appreciate well-rounded candidates.\n"
        "However they should not be overloaded with too many working hours, as academic study must remain their top priority. "
        "In conclusion, mandatory community service is highly beneficial for high school students as long as it is reasonably arranged."
    )


def test_analyze_writing_qa21_benchmark():
    payload = {
        "submissionModuleId": 15,
        "content": QA21_ESSAY,
        "moduleInstructions": "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?",
        "maxScore": 9.0,
        "aiProvider": "mock"
    }

    response = client.post("/api/v1/analyze/writing", json=payload)
    assert response.status_code == 200, f"Expected 200, got: {response.text}"

    data = response.json()
    assert data["submissionModuleId"] == 15
    assert data["overallScore"] == 6.5
    assert len(data["aiFeedback"]) > 50
    assert "IELTS Writing" in data["aiFeedback"]

    # Verify text metrics
    metrics = data["textMetrics"]
    assert metrics["wordCount"] > 100
    assert metrics["sentenceCount"] >= 3
    assert metrics["averageSentenceLength"] > 10.0
    assert 0.0 < metrics["lexicalDiversity"] <= 1.0
    assert metrics["fleschKincaidGrade"] > 0.0

    # Verify criteria scores
    criteria = data["criteriaScores"]
    assert criteria["taskResponse"] == 7.0
    assert criteria["coherenceAndCohesion"] == 6.5
    assert criteria["lexicalResource"] == 6.0
    assert criteria["grammaticalRangeAndAccuracy"] == 6.5
    assert criteria["overallScore"] == 6.5

    # Verify annotations for QA-21 fixed benchmark
    annotations = data["annotations"]
    assert isinstance(annotations, list)
    assert len(annotations) == 3

    ann1, ann2, ann3 = annotations[0], annotations[1], annotations[2]
    assert ann1["errorType"] == "GRAMMAR"
    assert "helps" in ann1["suggestedFix"]
    assert ann1["startOffset"] >= 0
    assert ann1["endOffset"] > ann1["startOffset"]

    assert ann2["errorType"] == "VOCABULARY"
    assert "benefit" in ann2["suggestedFix"]

    assert ann3["errorType"] == "PUNCTUATION"
    assert "However," in ann3["suggestedFix"]


def test_analyze_writing_deterministic_stability():
    """DoD: Chạy đúng với bộ dữ liệu mẫu từ QA-21, kết quả ổn định 100% giữa các lần gọi."""
    payload = {
        "submissionModuleId": 15,
        "content": QA21_ESSAY,
        "maxScore": 9.0,
        "aiProvider": "mock"
    }

    res1 = client.post("/api/v1/analyze/writing", json=payload).json()
    res2 = client.post("/api/v1/analyze/writing", json=payload).json()

    assert res1["overallScore"] == res2["overallScore"]
    assert res1["criteriaScores"] == res2["criteriaScores"]
    assert res1["textMetrics"] == res2["textMetrics"]
    assert res1["annotations"] == res2["annotations"]
    assert res1["aiFeedback"] == res2["aiFeedback"]


def test_analyze_writing_too_short_rejects_422():
    payload = {
        "submissionModuleId": 15,
        "content": "This is a very short text.",
        "maxScore": 9.0
    }
    response = client.post("/api/v1/analyze/writing", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "quá ngắn" in (data.get("detail") or data.get("message") or "")



def test_analyze_writing_empty_content_rejects_422():
    payload = {
        "submissionModuleId": 15,
        "content": "   ",
        "maxScore": 9.0
    }
    response = client.post("/api/v1/analyze/writing", json=payload)
    assert response.status_code == 422


@patch("app.api.v1.endpoints.writing._download_document", new_callable=AsyncMock)
def test_analyze_writing_presigned_url(mock_download: AsyncMock):
    """Kiểm tra chấm bài Viết qua Presigned URL documentUrl (.txt)."""
    mock_download.return_value = QA21_ESSAY.encode("utf-8")
    payload = {
        "submissionModuleId": 15,
        "documentUrl": "https://storage.example.com/submissions/essay.txt?presigned=true",
        "aiProvider": "mock",
        "maxScore": 9.0
    }
    response = client.post("/api/v1/analyze/writing", json=payload)
    assert response.status_code == 200, f"Error: {response.text}"
    mock_download.assert_awaited_once_with("https://storage.example.com/submissions/essay.txt?presigned=true")
    res = response.json()
    assert res["overallScore"] == 6.5
    assert res["criteriaScores"]["taskResponse"] == 7.0
    assert len(res["annotations"]) == 3


@pytest.mark.parametrize("provider,openrouter_key,gemini_key", [
    ("auto", "", ""),
    ("openrouter", "", "be76-test-key"),
    ("gemini", "be76-test-key", ""),
    ("unknown-provider", "be76-test-key", "be76-test-key"),
], ids=["auto-no-keys", "openrouter-missing-key", "gemini-missing-key", "unknown-provider"])
def test_analyze_writing_missing_provider_configuration_returns_503(
    monkeypatch: pytest.MonkeyPatch, provider: str, openrouter_key: str, gemini_key: str,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", False)
    monkeypatch.setattr(settings, "AI_PROVIDER", "auto")
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", openrouter_key)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", gemini_key)
    openrouter, gemini = AsyncMock(), AsyncMock()
    monkeypatch.setattr(GeminiService, "_call_openrouter_writing", openrouter)
    monkeypatch.setattr(GeminiService, "_call_gemini_direct_writing", gemini)

    response = client.post("/api/v1/analyze/writing", json={
        "submissionModuleId": 15, "content": QA21_ESSAY, "aiProvider": provider,
    })
    openrouter.assert_not_awaited()
    gemini.assert_not_awaited()
    body = response.json()
    assert response.status_code == 503, f"Thực tế {response.status_code}, providerUsed={body.get('providerUsed')}"
    assert body["success"] is False
    assert body["code"] == "HTTP_ERROR"
    assert body["detail"] == body["message"] == "Dịch vụ AI chưa sẵn sàng: nhà cung cấp chưa được cấu hình hợp lệ."


@pytest.mark.parametrize("provider", ["openrouter", "gemini"])
def test_analyze_writing_configured_provider_is_called(
    monkeypatch: pytest.MonkeyPatch, provider: str,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", False)
    monkeypatch.setattr(settings, "AI_PROVIDER", "auto")
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "be76-test-key" if provider == "openrouter" else "")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "be76-test-key" if provider == "gemini" else "")
    result = GeminiService._build_writing_response_from_json(
        15, QA21_ESSAY, {}, 9.0, model_used="be76-test-model", provider_used=provider,
    )
    openrouter, gemini = AsyncMock(return_value=result), AsyncMock(return_value=result)
    monkeypatch.setattr(GeminiService, "_call_openrouter_writing", openrouter)
    monkeypatch.setattr(GeminiService, "_call_gemini_direct_writing", gemini)

    response = client.post("/api/v1/analyze/writing", json={
        "submissionModuleId": 15, "content": QA21_ESSAY, "aiProvider": provider,
    })
    assert response.status_code == 200
    if provider == "openrouter":
        openrouter.assert_awaited_once()
        gemini.assert_not_awaited()
    else:
        gemini.assert_awaited_once()
        openrouter.assert_not_awaited()


@pytest.mark.parametrize("mock_mode,provider,provider_used", [
    (True, "auto", "auto-mock"),
    (False, "mock", "mock"),
], ids=["mock-mode", "explicit-mock"])
def test_analyze_writing_mock_mode_preserves_benchmark(
    monkeypatch: pytest.MonkeyPatch, mock_mode: bool, provider: str, provider_used: str,
) -> None:
    monkeypatch.setattr(settings, "MOCK_MODE", mock_mode)
    monkeypatch.setattr(settings, "AI_PROVIDER", "auto")
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    openrouter, gemini = AsyncMock(), AsyncMock()
    monkeypatch.setattr(GeminiService, "_call_openrouter_writing", openrouter)
    monkeypatch.setattr(GeminiService, "_call_gemini_direct_writing", gemini)

    response = client.post("/api/v1/analyze/writing", json={
        "submissionModuleId": 15, "content": QA21_ESSAY, "aiProvider": provider,
    })
    assert response.status_code == 200
    assert response.json()["providerUsed"] == provider_used
    openrouter.assert_not_awaited()
    gemini.assert_not_awaited()

