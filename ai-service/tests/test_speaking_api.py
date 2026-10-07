try:
    import pytest
except ImportError:
    pytest = None
import base64
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "EnglishHub AI Service" in data["service"]
    assert "activeProvider" in data
    assert "openrouterConfigured" in data
    assert "openrouterModel" in data


def test_analyze_speaking_qa21_benchmark():
    mock_audio_b64 = base64.b64encode(b"ID3\x03\x00\x00\x00\x00\x00\x00mockaudiobytes").decode("ascii")

    payload = {
        "submissionModuleId": 14,
        "audioBase64": mock_audio_b64,
        "audioStorageKey": "submissions/speaking_14.mp3",
        "moduleInstructions": "Describe a book you enjoyed reading recently.",
        "aiInstructionSnapshot": "Standard IELTS Speaking Part 2 Rubric",
        "maxScore": 9.0
    }

    response = client.post("/api/v1/analyze/speaking", json=payload)
    assert response.status_code == 200, f"Expected 200, got: {response.text}"
    
    data = response.json()
    assert data["submissionModuleId"] == 14
    assert 6.5 <= data["overallScore"] <= 7.5
    assert len(data["aiFeedback"]) > 50
    assert "IELTS Speaking" in data["aiFeedback"]

    # Verify transcript schema matches GradingMockDataSeeder invariants
    transcript = data["aiTranscript"]
    assert isinstance(transcript, list)
    assert len(transcript) > 0
    for word_item in transcript:
        assert "word" in word_item and isinstance(word_item["word"], str)
        assert "start" in word_item and isinstance(word_item["start"], (int, float))
        assert "end" in word_item and isinstance(word_item["end"], (int, float))
        assert "confidence" in word_item and isinstance(word_item["confidence"], (int, float))

    # Verify fluency metrics
    fluency = data["fluencyMetrics"]
    assert fluency["wordsPerMinute"] > 90.0
    assert fluency["totalDurationSeconds"] > 0
    assert fluency["pauseCount"] >= 0

    # Verify criteria scores
    criteria = data["criteriaScores"]
    assert criteria["fluencyAndCoherence"] == 7.0
    assert criteria["lexicalResource"] == 6.5
    assert criteria["grammaticalRangeAndAccuracy"] == 7.0
    assert criteria["pronunciation"] == 7.0

    # Verify annotations for QA-21 fixed benchmark
    annotations = data["annotations"]
    assert isinstance(annotations, list)
    assert len(annotations) >= 2
    for ann in annotations:
        assert ann["startOffset"] >= 0
        assert ann["endOffset"] > ann["startOffset"]
        assert ann["errorType"] == "PRONUNCIATION"
        assert ann["suggestedFix"] is not None


def test_analyze_speaking_missing_audio_rejects_400():
    payload = {
        "submissionModuleId": 14,
        "moduleInstructions": "Describe a book",
        "maxScore": 9.0
    }
    response = client.post("/api/v1/analyze/speaking", json=payload)
    assert response.status_code == 400
