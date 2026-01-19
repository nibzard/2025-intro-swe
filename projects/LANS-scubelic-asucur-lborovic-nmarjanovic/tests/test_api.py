import pytest
from httpx import AsyncClient
from llm_answer_watcher.api import app
import sqlite3
import os
import datetime
from freezegun import freeze_time

# Define a test SQLite database path
TEST_DB_PATH = "./test_output/test_watcher.db"

@pytest.fixture(name="test_app")
async def test_app_fixture():
    """Fixture for FastAPI test client."""
    # Ensure a clean test database for each test
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    os.makedirs(os.path.dirname(TEST_DB_PATH), exist_ok=True)

    # Override the sqlite_db_path for testing purposes if needed
    # (not directly used here as it's passed in the config)

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    # Clean up test database after tests
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    if os.path.exists(os.path.dirname(TEST_DB_PATH)):
        os.rmdir(os.path.dirname(TEST_DB_PATH))

@pytest.fixture
def sample_config_data():
    """Sample valid configuration data for testing."""
    return {
        "api_key": "test_api_key_123",
        "yaml_config": """
run_settings:
  output_dir: ./test_output
  sqlite_db_path: ./test_output/test_watcher.db
  max_concurrent_requests: 1
  models:
    - provider: google
      model_name: gemini-1.5-flash
      env_api_key: GEMINI_API_KEY
brands:
  mine:
    - MyBrand
  competitors:
    - CompA
    - CompB
intents:
  - id: intent-1
    prompt: What are the best marketing tools?
  - id: intent-2
    prompt: Is MyBrand a good choice for SaaS?
"""
    }

@pytest.fixture
def invalid_config_data():
    """Sample invalid configuration data for testing."""
    return {
        "api_key": "test_api_key_123",
        "yaml_config": """
invalid_key:
  sub_key: value
"""
    }

@pytest.fixture
def config_without_api_key():
    """Sample configuration data missing API key."""
    return {
        "api_key": "",
        "yaml_config": """
run_settings:
  output_dir: ./test_output
  sqlite_db_path: ./test_output/test_watcher.db
  max_concurrent_requests: 1
  models:
    - provider: google
      model_name: gemini-1.5-flash
      env_api_key: GEMINI_API_KEY
brands:
  mine:
    - MyBrand
intents:
  - id: intent-1
    prompt: Test prompt
"""
    }

@pytest.fixture
def config_without_brands():
    """Sample configuration data missing brands."""
    return {
        "api_key": "test_api_key_123",
        "yaml_config": """
run_settings:
  output_dir: ./test_output
  sqlite_db_path: ./test_output/test_watcher.db
  max_concurrent_requests: 1
  models:
    - provider: google
      model_name: gemini-1.5-flash
      env_api_key: GEMINI_API_KEY
intents:
  - id: intent-1
    prompt: Test prompt
"""
    }

@pytest.fixture
def config_without_intents():
    """Sample configuration data missing intents."""
    return {
        "api_key": "test_api_key_123",
        "yaml_config": """
run_settings:
  output_dir: ./test_output
  sqlite_db_path: ./test_output/test_watcher.db
  max_concurrent_requests: 1
  models:
    - provider: google
      model_name: gemini-1.5-flash
      env_api_key: GEMINI_API_KEY
brands:
  mine:
    - MyBrand
intents: []
"""
    }

@freeze_time("2025-11-02 08:00:00")
class TestAPI:

    async def test_read_root(self, test_app: AsyncClient):
        """Test the root endpoint."""
        response = await test_app.get("/")
        assert response.status_code == 200
        assert response.json() == {"Hello": "World"}

    async def test_run_watcher_success(self, test_app: AsyncClient, sample_config_data: dict):
        """Test /run_watcher endpoint with valid data."""
        response = await test_app.post("/run_watcher", json=sample_config_data)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Watcher logic executed and results stored"
        assert "run_id" in data
        assert "results" in data
        assert len(data["results"]) == 2 # Two intents

        # Verify data in the test database
        with sqlite3.connect(TEST_DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            run_summary = conn.execute("SELECT * FROM runs WHERE run_id = ?", (data["run_id"],)).fetchone()
            assert run_summary is not None
            assert run_summary["total_intents"] == 2

            answers = conn.execute("SELECT * FROM answers_raw WHERE run_id = ?", (data["run_id"],)).fetchall()
            assert len(answers) == 2

            mentions = conn.execute("SELECT * FROM mentions WHERE run_id = ?", (data["run_id"],)).fetchall()
            # Expected mentions based on sample config and simulated response
            # Each intent's simulated response contains both my_brand and comp_brand mentions
            assert len(mentions) == 4 # 2 intents * (1 mine + 1 competitor)

    async def test_run_watcher_invalid_yaml(self, test_app: AsyncClient, invalid_config_data: dict):
        """Test /run_watcher endpoint with invalid YAML."""
        response = await test_app.post("/run_watcher", json=invalid_config_data)
        assert response.status_code == 400
        assert "Invalid YAML configuration" in response.json()["detail"]

    async def test_run_watcher_missing_api_key(self, test_app: AsyncClient, config_without_api_key: dict):
        """Test /run_watcher endpoint with missing API key."""
        response = await test_app.post("/run_watcher", json=config_without_api_key)
        assert response.status_code == 400
        assert response.json()["detail"] == "Gemini API key is required."

    async def test_run_watcher_missing_brands(self, test_app: AsyncClient, config_without_brands: dict):
        """Test /run_watcher endpoint with missing brands."""
        response = await test_app.post("/run_watcher", json=config_without_brands)
        assert response.status_code == 400
        assert response.json()["detail"] == "Configuration missing 'brands'."
    
    async def test_run_watcher_missing_intents(self, test_app: AsyncClient, config_without_intents: dict):
        """Test /run_watcher endpoint with missing intents."""
        response = await test_app.post("/run_watcher", json=config_without_intents)
        assert response.status_code == 400
        assert response.json()["detail"] == "Configuration 'intents' must contain at least one valid intent with 'id' and 'prompt'."

    async def test_get_run_results_success(self, test_app: AsyncClient, sample_config_data: dict):
        """Test /results/{run_id} endpoint after a successful run."""
        # First, run the watcher to populate the DB
        run_response = await test_app.post("/run_watcher", json=sample_config_data)
        assert run_response.status_code == 200
        run_id = run_response.json()["run_id"]

        # Then, get the results
        results_response = await test_app.get(f"/results/{run_id}")
        assert results_response.status_code == 200
        data = results_response.json()
        assert "run_summary" in data
        assert data["run_summary"]["run_id"] == run_id
        assert "intents_data" in data
        assert len(data["intents_data"]) == 2 # Two intents
        assert len(data["intents_data"][0]["mentions"]) == 2 # 2 mentions per intent (simulated)

    async def test_get_run_results_not_found(self, test_app: AsyncClient):
        """Test /results/{run_id} endpoint with a non-existent run_id."""
        response = await test_app.get("/results/non_existent_run")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
