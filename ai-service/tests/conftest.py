import os
import sys

# Ensure app package is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force MOCK_MODE for tests
os.environ["MOCK_MODE"] = "true"
os.environ["GEMINI_API_KEY"] = ""
# Set internal secret for tests (middleware requires it for non-health endpoints)
os.environ.setdefault("INTERNAL_SECRET", "test-internal-secret")

