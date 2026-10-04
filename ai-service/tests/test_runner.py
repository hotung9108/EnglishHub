import unittest
import base64
import os
import sys

# Ensure app package is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["MOCK_MODE"] = "true"
os.environ["GEMINI_API_KEY"] = ""

from fastapi.testclient import TestClient
from app.main import app


class TestSpeakingApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("EnglishHub AI Service", data["service"])
        self.assertIn("activeProvider", data)
        self.assertIn("openrouterConfigured", data)
        self.assertIn("openrouterModel", data)

    def test_analyze_speaking_qa21_benchmark(self):
        mock_audio_b64 = base64.b64encode(b"ID3\x03\x00\x00\x00\x00\x00\x00mockaudiobytes").decode("ascii")
        payload = {
            "submissionModuleId": 14,
            "audioBase64": mock_audio_b64,
            "audioStorageKey": "submissions/speaking_14.mp3",
            "moduleInstructions": "Describe a book you enjoyed reading recently.",
            "aiInstructionSnapshot": "Standard IELTS Speaking Part 2 Rubric",
            "maxScore": 9.0
        }

        response = self.client.post("/api/v1/analyze/speaking", json=payload)
        self.assertEqual(response.status_code, 200, f"Error: {response.text}")

        data = response.json()
        self.assertEqual(data["submissionModuleId"], 14)
        self.assertTrue(6.5 <= data["overallScore"] <= 7.5)
        self.assertIn("IELTS Speaking", data["aiFeedback"])

        transcript = data["aiTranscript"]
        self.assertIsInstance(transcript, list)
        self.assertGreater(len(transcript), 0)
        for w in transcript:
            self.assertIn("word", w)
            self.assertIn("start", w)
            self.assertIn("end", w)
            self.assertIn("confidence", w)

        fluency = data["fluencyMetrics"]
        self.assertGreater(fluency["wordsPerMinute"], 90.0)

        criteria = data["criteriaScores"]
        self.assertEqual(criteria["fluencyAndCoherence"], 7.0)
        self.assertEqual(criteria["pronunciation"], 7.0)

        annotations = data["annotations"]
        self.assertGreaterEqual(len(annotations), 2)
        for ann in annotations:
            self.assertGreaterEqual(ann["startOffset"], 0)
            self.assertGreater(ann["endOffset"], ann["startOffset"])
            self.assertEqual(ann["errorType"], "PRONUNCIATION")

    def test_analyze_speaking_missing_audio_rejects_400(self):
        payload = {
            "submissionModuleId": 14,
            "moduleInstructions": "Describe a book",
            "maxScore": 9.0
        }
        response = self.client.post("/api/v1/analyze/speaking", json=payload)
        self.assertEqual(response.status_code, 400)

    def test_analyze_speaking_direct_upload(self):
        fake_audio = b"ID3\x03\x00\x00\x00\x00\x00\x00samplemockbytes"
        files = {
            "file": ("test.mp3", fake_audio, "audio/mp3")
        }
        data = {
            "submissionModuleId": 14,
            "maxScore": "9.0"
        }
        response = self.client.post("/api/v1/analyze/speaking/upload", files=files, data=data)
        self.assertEqual(response.status_code, 200, f"Error: {response.text}")
        res_json = response.json()
        self.assertEqual(res_json["submissionModuleId"], 14)
        self.assertGreaterEqual(res_json["overallScore"], 6.5)

    def test_analyze_speaking_dynamic_model_and_provider(self):
        mock_audio_b64 = base64.b64encode(b"ID3\x03\x00\x00\x00\x00\x00\x00mockaudiobytes").decode("ascii")
        payload = {
            "submissionModuleId": 15,
            "audioBase64": mock_audio_b64,
            "moduleInstructions": "Describe your favorite hobby.",
            "maxScore": 9.0,
            "model": "anthropic/claude-3.5-sonnet",
            "aiProvider": "openrouter"
        }
        response = self.client.post("/api/v1/analyze/speaking", json=payload)
        self.assertEqual(response.status_code, 200, f"Error: {response.text}")
        data = response.json()
        self.assertEqual(data["submissionModuleId"], 15)
        self.assertEqual(data["modelUsed"], "anthropic/claude-3.5-sonnet")
        self.assertEqual(data["providerUsed"], "openrouter-mock")

    def test_analyze_speaking_direct_upload_with_custom_model(self):
        fake_audio = b"ID3\x03\x00\x00\x00\x00\x00\x00samplemockbytes"
        files = {
            "file": ("test.mp3", fake_audio, "audio/mp3")
        }
        data = {
            "submissionModuleId": 16,
            "maxScore": "9.0",
            "model": "google/gemini-1.5-pro",
            "aiProvider": "gemini"
        }
        response = self.client.post("/api/v1/analyze/speaking/upload", files=files, data=data)
        self.assertEqual(response.status_code, 200, f"Error: {response.text}")
        res_json = response.json()
        self.assertEqual(res_json["submissionModuleId"], 16)
        self.assertEqual(res_json["modelUsed"], "google/gemini-1.5-pro")
        self.assertEqual(res_json["providerUsed"], "gemini-mock")


if __name__ == "__main__":
    unittest.main()

