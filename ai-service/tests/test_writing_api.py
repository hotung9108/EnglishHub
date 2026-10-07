try:
    import pytest
except ImportError:
    pytest = None
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

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
    assert "quá ngắn" in response.json()["detail"]


def test_analyze_writing_empty_content_rejects_422():
    payload = {
        "submissionModuleId": 15,
        "content": "   ",
        "maxScore": 9.0
    }
    response = client.post("/api/v1/analyze/writing", json=payload)
    assert response.status_code == 422


def test_analyze_writing_upload_txt():
    """Kiểm tra upload trực tiếp file tài liệu (.txt) để chấm điểm."""
    essay_bytes = QA21_ESSAY.encode("utf-8")
    files = {"file": ("student_essay.txt", essay_bytes, "text/plain")}
    data = {
        "submissionModuleId": "15",
        "aiProvider": "mock",
        "maxScore": "9.0"
    }
    response = client.post("/api/v1/analyze/writing/upload", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["overallScore"] == 6.5
    assert res["criteriaScores"]["taskResponse"] == 7.0
    assert len(res["annotations"]) == 3

