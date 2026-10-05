# EnglishHub AI Microservice (FastAPI)

Standalone AI Service for processing and evaluating English Speaking assignments via OpenRouter (Multi-model) and Google Gemini Flash Multimodal.

## Features
- **Stateless & Async**: Built on FastAPI with asynchronous non-blocking I/O.
- **Multi-Provider AI Engine**: Native support for **OpenRouter** (`https://openrouter.ai/api/v1`) with automatic fallback to **Google Gemini Direct API**.
- **Multimodal Audio Processing**: Directly ingests MP3/WAV/M4A audio bytes from Neon Storage S3 without writing temporary files to disk.
- **Speech-to-Text & Word-level Alignment**: Produces word tokens with start/end timestamps and confidence scores.
- **Acoustic & Fluency Engine**: Objective WPM, pause intervals (>0.5s), and Phonation Time Ratio (PTR).
- **IELTS/CEFR Rubric Reasoning**: Scores 4 criteria (Fluency, Lexical, Grammar, Pronunciation).
- **Error Localization**: Generates annotations with character offsets and IPA pronunciation guides.
- **QA-21 Deterministic Benchmark**: In-memory mock/benchmark support for automated CI/CD testing.


## Running Locally

```bash
# 1. Install dependencies
cd ai-service
pip install -r requirements.txt

# 2. Run with uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Running with Docker

```bash
docker build -t englishhub-ai-service .
docker run -p 8001:8001 -e GEMINI_API_KEY="your-key" englishhub-ai-service
```

## API Documentation
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`
- Health check: `GET http://localhost:8001/health`
- Speaking analysis: `POST http://localhost:8001/api/v1/analyze/speaking`
