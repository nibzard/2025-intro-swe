"""
Tests for llm_runner.runner module.

Tests the core orchestration engine with mocked LLM clients and database.
"""

import json
import os
from unittest.mock import MagicMock, patch

from freezegun import freeze_time

from llm_answer_watcher.config.schema import (
    Brands,
    Intent,
    ModelConfig,
    RunSettings,
    RuntimeConfig,
    RuntimeModel,
)
from llm_answer_watcher.extractor.mention_detector import BrandMention
from llm_answer_watcher.extractor.parser import ExtractionResult
from llm_answer_watcher.extractor.rank_extractor import RankedBrand
from llm_answer_watcher.llm_runner.models import LLMResponse
from llm_answer_watcher.llm_runner.runner import RawAnswerRecord, run_all


class TestRawAnswerRecord:
    """Tests for RawAnswerRecord dataclass."""

    def test_dataclass_creation(self):
        """Test creating RawAnswerRecord with all fields."""
        record = RawAnswerRecord(
            intent_id="email-warmup",
            prompt="What are the best email warmup tools?",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
            answer_text="Here are the best tools...",
            answer_length=500,
            usage_meta={"prompt_tokens": 100, "completion_tokens": 400},
            estimated_cost_usd=0.001,
        )

        assert record.intent_id == "email-warmup"
        assert record.prompt == "What are the best email warmup tools?"
        assert record.model_provider == "openai"
        assert record.model_name == "gpt-4o-mini"
        assert record.timestamp_utc == "2025-11-02T08:00:00Z"
        assert record.answer_text == "Here are the best tools..."
        assert record.answer_length == 500
        assert record.usage_meta == {"prompt_tokens": 100, "completion_tokens": 400}
        assert record.estimated_cost_usd == 0.001

    def test_dataclass_is_serializable(self):
        """Test that RawAnswerRecord can be converted to dict."""
        from dataclasses import asdict

        record = RawAnswerRecord(
            intent_id="test",
            prompt="test prompt",
            model_provider="openai",
            model_name="gpt-4o",
            timestamp_utc="2025-11-02T08:00:00Z",
            answer_text="test answer",
            answer_length=11,
            usage_meta={"prompt_tokens": 10, "completion_tokens": 20},
            estimated_cost_usd=0.0001,
        )

        data = asdict(record)
        assert isinstance(data, dict)
        assert data["intent_id"] == "test"
        assert data["usage_meta"] == {"prompt_tokens": 10, "completion_tokens": 20}


def create_test_config(
    my_brand: str = "InstantFlow",
    my_brand_aliases: list[str] | None = None,
    competitors: list[str] | None = None,
    intents: list[Intent] | None = None,
    models: list[RuntimeModel] | None = None,
    output_dir: str = "./output",
    database_path: str = "./test.db",
) -> RuntimeConfig:
    """Helper to create RuntimeConfig for tests."""
    if my_brand_aliases is None:
        my_brand_aliases = []
    if competitors is None:
        competitors = []
    if intents is None:
        intents = [Intent(id="test", prompt="Test prompt")]
    if models is None:
        models = [
            RuntimeModel(
                provider="openai",
                model_name="gpt-4o-mini",
                api_key="test-key",
                system_prompt="You are a helpful assistant.",
            )
        ]

    # Build full brand list
    all_my_brands = [my_brand] + my_brand_aliases

    return RuntimeConfig(
        run_settings=RunSettings(
            output_dir=output_dir,
            sqlite_db_path=database_path,
            models=[
                ModelConfig(
                    provider=m.provider,
                    model_name=m.model_name,
                    env_api_key="TEST_API_KEY",
                )
                for m in models
            ],
            use_llm_rank_extraction=False,
        ),
        brands=Brands(
            mine=all_my_brands,
            competitors=competitors,
        ),
        intents=intents,
        models=models,
    )


class TestRunAll:
    """Tests for run_all orchestration function."""

    @freeze_time("2025-11-02 08:00:00")
    @patch("llm_answer_watcher.llm_runner.runner.build_client")
    @patch("llm_answer_watcher.llm_runner.runner.parse_answer")
    @patch("llm_answer_watcher.llm_runner.runner.insert_run")
    @patch("llm_answer_watcher.llm_runner.runner.insert_answer_raw")
    @patch("llm_answer_watcher.llm_runner.runner.insert_mention")
    def test_successful_single_query(
        self,
        mock_insert_mention,
        mock_insert_answer,
        mock_insert_run,
        mock_parse_answer,
        mock_build_client,
        tmp_path,
    ):
        """Test run_all with single successful query."""
        # Setup config
        config = create_test_config(
            my_brand="InstantFlow",
            my_brand_aliases=["IF"],
            competitors=["Competitor1"],
            intents=[Intent(id="email-warmup", prompt="Best email warmup tools?")],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="test-key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
            output_dir=str(tmp_path / "output"),
            database_path=str(tmp_path / "test.db"),
        )

        # Mock LLM client
        mock_client = MagicMock()
        mock_client.generate_answer.return_value = LLMResponse(
            answer_text="InstantFlow is the best email warmup tool.",
            tokens_used=150,  # 100 + 50
            cost_usd=0.000075,  # Estimated cost for 150 tokens
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
        )
        mock_build_client.return_value = mock_client

        # Mock parser
        mock_parse_answer.return_value = ExtractionResult(
            intent_id="email-warmup",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
            appeared_mine=True,
            my_mentions=[
                BrandMention(
                    original_text="InstantFlow",
                    normalized_name="InstantFlow",
                    brand_category="mine",
                    match_position=0,
                )
            ],
            competitor_mentions=[],
            ranked_list=[
                RankedBrand(brand_name="InstantFlow", rank_position=1, confidence=1.0)
            ],
            rank_extraction_method="pattern",
            rank_confidence=1.0,
        )

        # Run
        result = run_all(config)

        # Verify result structure
        assert result["run_id"] == "2025-11-02T08-00-00Z"
        assert result["timestamp_utc"] == "2025-11-02T08:00:00Z"
        assert result["total_intents"] == 1
        assert result["total_models"] == 1
        assert result["total_queries"] == 1
        assert result["success_count"] == 1
        assert result["error_count"] == 0
        assert result["total_cost_usd"] > 0
        assert len(result["errors"]) == 0

        # Verify output directory was created
        assert os.path.exists(result["output_dir"])

        # Verify raw answer JSON was written
        raw_file = os.path.join(
            result["output_dir"], "intent_email-warmup_raw_openai_gpt-4o-mini.json"
        )
        assert os.path.exists(raw_file)

        # Verify parsed answer JSON was written
        parsed_file = os.path.join(
            result["output_dir"], "intent_email-warmup_parsed_openai_gpt-4o-mini.json"
        )
        assert os.path.exists(parsed_file)

        # Verify run_meta.json was written
        meta_file = os.path.join(result["output_dir"], "run_meta.json")
        assert os.path.exists(meta_file)

        # Verify database operations were called
        mock_insert_run.assert_called_once()
        mock_insert_answer.assert_called_once()
        mock_insert_mention.assert_called_once()

    @freeze_time("2025-11-02 08:00:00")
    @patch("llm_answer_watcher.llm_runner.runner.build_client")
    @patch("llm_answer_watcher.llm_runner.runner.parse_answer")
    @patch("llm_answer_watcher.llm_runner.runner.insert_run")
    @patch("llm_answer_watcher.llm_runner.runner.insert_answer_raw")
    @patch("llm_answer_watcher.llm_runner.runner.insert_mention")
    def test_multiple_intents_and_models(
        self,
        mock_insert_mention,
        mock_insert_answer,
        mock_insert_run,
        mock_parse_answer,
        mock_build_client,
        tmp_path,
    ):
        """Test run_all with multiple intents and models."""
        # Setup config with 2 intents x 2 models = 4 total queries
        config = create_test_config(
            my_brand="InstantFlow",
            my_brand_aliases=[],
            competitors=["Competitor1"],
            intents=[
                Intent(id="intent1", prompt="Prompt 1"),
                Intent(id="intent2", prompt="Prompt 2"),
            ],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="key1",
                    system_prompt="You are a helpful assistant.",
                ),
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o",
                    api_key="key2",
                    system_prompt="You are a helpful assistant.",
                ),
            ],
            output_dir=str(tmp_path / "output"),
            database_path=str(tmp_path / "test.db"),
        )

        # Mock LLM client
        mock_client = MagicMock()
        mock_client.generate_answer.return_value = LLMResponse(
            answer_text="Test answer",
            tokens_used=75,  # 50 + 25
            cost_usd=0.000045,  # Estimated cost for 75 tokens
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
        )
        mock_build_client.return_value = mock_client

        # Mock parser - create function to return appropriate ExtractionResult
        def create_extraction_result(
            answer_text,
            brands,
            intent_id,
            provider,
            model_name,
            timestamp_utc,
            **kwargs,
        ):
            return ExtractionResult(
                intent_id=intent_id,
                model_provider=provider,
                model_name=model_name,
                timestamp_utc=timestamp_utc,
                appeared_mine=False,
                my_mentions=[],
                competitor_mentions=[],
                ranked_list=[],
                rank_extraction_method="pattern",
                rank_confidence=0.0,
            )

        mock_parse_answer.side_effect = create_extraction_result

        # Run
        result = run_all(config)

        # Verify totals
        assert result["total_intents"] == 2
        assert result["total_models"] == 2
        assert result["total_queries"] == 4
        assert result["success_count"] == 4
        assert result["error_count"] == 0

        # Verify all 4 raw answer files were written
        run_dir = result["output_dir"]
        assert os.path.exists(
            os.path.join(run_dir, "intent_intent1_raw_openai_gpt-4o-mini.json")
        )
        assert os.path.exists(
            os.path.join(run_dir, "intent_intent1_raw_openai_gpt-4o.json")
        )
        assert os.path.exists(
            os.path.join(run_dir, "intent_intent2_raw_openai_gpt-4o-mini.json")
        )
        assert os.path.exists(
            os.path.join(run_dir, "intent_intent2_raw_openai_gpt-4o.json")
        )

        # Verify database operations were called 4 times (once per query)
        assert mock_insert_answer.call_count == 4

    @freeze_time("2025-11-02 08:00:00")
    @patch("llm_answer_watcher.llm_runner.runner.build_client")
    @patch("llm_answer_watcher.llm_runner.runner.parse_answer")
    @patch("llm_answer_watcher.llm_runner.runner.insert_run")
    @patch("llm_answer_watcher.llm_runner.runner.insert_answer_raw")
    @patch("llm_answer_watcher.llm_runner.runner.insert_mention")
    def test_partial_failure_handling(
        self,
        mock_insert_mention,
        mock_insert_answer,
        mock_insert_run,
        mock_parse_answer,
        mock_build_client,
        tmp_path,
    ):
        """Test run_all handles partial failures gracefully."""
        config = create_test_config(
            my_brand="InstantFlow",
            my_brand_aliases=[],
            competitors=[],
            intents=[
                Intent(id="intent1", prompt="Prompt 1"),
                Intent(id="intent2", prompt="Prompt 2"),
            ],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
            output_dir=str(tmp_path / "output"),
            database_path=str(tmp_path / "test.db"),
        )

        # Mock LLM client - first call succeeds, second fails
        mock_client = MagicMock()
        mock_client.generate_answer.side_effect = [
            LLMResponse(
                answer_text="Success answer",
                tokens_used=75,  # 50 + 25
                cost_usd=0.000045,  # Estimated cost for 75 tokens
                provider="openai",
                model_name="gpt-4o-mini",
                timestamp_utc="2025-11-02T08:00:00Z",
            ),
            Exception("API rate limit exceeded"),
        ]
        mock_build_client.return_value = mock_client

        # Mock parser - create function to return appropriate ExtractionResult
        def create_extraction_result(
            answer_text,
            brands,
            intent_id,
            provider,
            model_name,
            timestamp_utc,
            **kwargs,
        ):
            return ExtractionResult(
                intent_id=intent_id,
                model_provider=provider,
                model_name=model_name,
                timestamp_utc=timestamp_utc,
                appeared_mine=False,
                my_mentions=[],
                competitor_mentions=[],
                ranked_list=[],
                rank_extraction_method="pattern",
                rank_confidence=0.0,
            )

        mock_parse_answer.side_effect = create_extraction_result

        # Run
        result = run_all(config)

        # Verify partial success
        assert result["total_queries"] == 2
        assert result["success_count"] == 1
        assert result["error_count"] == 1
        assert len(result["errors"]) == 1

        # Verify error details
        error = result["errors"][0]
        assert error["intent_id"] == "intent2"
        assert error["model_provider"] == "openai"
        assert error["model_name"] == "gpt-4o-mini"
        assert "rate limit" in error["error_message"]

        # Verify success file exists
        run_dir = result["output_dir"]
        assert os.path.exists(
            os.path.join(run_dir, "intent_intent1_raw_openai_gpt-4o-mini.json")
        )

        # Verify error file exists
        assert os.path.exists(
            os.path.join(run_dir, "intent_intent2_error_openai_gpt-4o-mini.json")
        )

        # Verify error file content
        error_file = os.path.join(
            run_dir, "intent_intent2_error_openai_gpt-4o-mini.json"
        )
        with open(error_file, encoding="utf-8") as f:
            error_data = json.load(f)
        assert "rate limit" in error_data["error_message"]

    @freeze_time("2025-11-02 08:00:00")
    @patch("llm_answer_watcher.llm_runner.runner.build_client")
    @patch("llm_answer_watcher.llm_runner.runner.parse_answer")
    @patch("llm_answer_watcher.llm_runner.runner.insert_run")
    @patch("llm_answer_watcher.llm_runner.runner.insert_answer_raw")
    @patch("llm_answer_watcher.llm_runner.runner.insert_mention")
    def test_cost_calculation(
        self,
        mock_insert_mention,
        mock_insert_answer,
        mock_insert_run,
        mock_parse_answer,
        mock_build_client,
        tmp_path,
    ):
        """Test that costs are calculated and summed correctly."""
        config = create_test_config(
            my_brand="InstantFlow",
            my_brand_aliases=[],
            competitors=[],
            intents=[Intent(id="intent1", prompt="Prompt")],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
            output_dir=str(tmp_path / "output"),
            database_path=str(tmp_path / "test.db"),
        )

        # Mock LLM client with known token counts
        mock_client = MagicMock()
        mock_client.generate_answer.return_value = LLMResponse(
            answer_text="Answer",
            tokens_used=1500,  # 1000 + 500
            cost_usd=0.0009,  # Estimated cost for 1500 tokens
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
        )
        mock_build_client.return_value = mock_client

        # Mock parser - create function to return appropriate ExtractionResult
        def create_extraction_result(
            answer_text,
            brands,
            intent_id,
            provider,
            model_name,
            timestamp_utc,
            **kwargs,
        ):
            return ExtractionResult(
                intent_id=intent_id,
                model_provider=provider,
                model_name=model_name,
                timestamp_utc=timestamp_utc,
                appeared_mine=False,
                my_mentions=[],
                competitor_mentions=[],
                ranked_list=[],
                rank_extraction_method="pattern",
                rank_confidence=0.0,
            )

        mock_parse_answer.side_effect = create_extraction_result

        # Run
        result = run_all(config)

        # Verify cost is calculated and non-zero
        assert result["total_cost_usd"] > 0
        assert isinstance(result["total_cost_usd"], float)

        # Verify run_meta.json contains cost
        meta_file = os.path.join(result["output_dir"], "run_meta.json")
        with open(meta_file, encoding="utf-8") as f:
            meta = json.load(f)
        assert meta["total_cost_usd"] == result["total_cost_usd"]

    @freeze_time("2025-11-02 08:00:00")
    @patch("llm_answer_watcher.llm_runner.runner.build_client")
    @patch("llm_answer_watcher.llm_runner.runner.parse_answer")
    @patch("llm_answer_watcher.llm_runner.runner.insert_run")
    @patch("llm_answer_watcher.llm_runner.runner.insert_answer_raw")
    @patch("llm_answer_watcher.llm_runner.runner.insert_mention")
    def test_database_errors_dont_stop_execution(
        self,
        mock_insert_mention,
        mock_insert_answer,
        mock_insert_run,
        mock_parse_answer,
        mock_build_client,
        tmp_path,
    ):
        """Test that database errors are logged but don't stop execution."""
        config = create_test_config(
            my_brand="InstantFlow",
            my_brand_aliases=[],
            competitors=[],
            intents=[Intent(id="intent1", prompt="Prompt")],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
            output_dir=str(tmp_path / "output"),
            database_path=str(tmp_path / "test.db"),
        )

        # Mock LLM client
        mock_client = MagicMock()
        mock_client.generate_answer.return_value = LLMResponse(
            answer_text="Answer",
            tokens_used=75,  # 50 + 25
            cost_usd=0.000045,  # Estimated cost for 75 tokens
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
        )
        mock_build_client.return_value = mock_client

        # Mock parser - create function to return appropriate ExtractionResult
        def create_extraction_result(
            answer_text,
            brands,
            intent_id,
            provider,
            model_name,
            timestamp_utc,
            **kwargs,
        ):
            return ExtractionResult(
                intent_id=intent_id,
                model_provider=provider,
                model_name=model_name,
                timestamp_utc=timestamp_utc,
                appeared_mine=False,
                my_mentions=[],
                competitor_mentions=[],
                ranked_list=[],
                rank_extraction_method="pattern",
                rank_confidence=0.0,
            )

        mock_parse_answer.side_effect = create_extraction_result

        # Mock database operations to fail
        mock_insert_run.side_effect = Exception("Database error")
        mock_insert_answer.side_effect = Exception("Database error")
        mock_insert_mention.side_effect = Exception("Database error")

        # Run should still succeed despite database errors
        result = run_all(config)

        # Verify run completed successfully
        assert result["success_count"] == 1
        assert result["error_count"] == 0

        # Verify JSON files were still written
        run_dir = result["output_dir"]
        assert os.path.exists(
            os.path.join(run_dir, "intent_intent1_raw_openai_gpt-4o-mini.json")
        )
        assert os.path.exists(os.path.join(run_dir, "run_meta.json"))

    @freeze_time("2025-11-02 08:00:00")
    @patch("llm_answer_watcher.llm_runner.runner.build_client")
    @patch("llm_answer_watcher.llm_runner.runner.parse_answer")
    @patch("llm_answer_watcher.llm_runner.runner.insert_run")
    @patch("llm_answer_watcher.llm_runner.runner.insert_answer_raw")
    @patch("llm_answer_watcher.llm_runner.runner.insert_mention")
    def test_mentions_inserted_into_database(
        self,
        mock_insert_mention,
        mock_insert_answer,
        mock_insert_run,
        mock_parse_answer,
        mock_build_client,
        tmp_path,
    ):
        """Test that extracted mentions are inserted into database."""
        config = create_test_config(
            my_brand="InstantFlow",
            my_brand_aliases=["IF"],
            competitors=["Competitor1"],
            intents=[Intent(id="intent1", prompt="Prompt")],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
            output_dir=str(tmp_path / "output"),
            database_path=str(tmp_path / "test.db"),
        )

        # Mock LLM client
        mock_client = MagicMock()
        mock_client.generate_answer.return_value = LLMResponse(
            answer_text="InstantFlow and Competitor1 are both good.",
            tokens_used=75,  # 50 + 25
            cost_usd=0.000045,  # Estimated cost for 75 tokens
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
        )
        mock_build_client.return_value = mock_client

        # Mock parser to return mentions
        mock_parse_answer.return_value = ExtractionResult(
            intent_id="intent1",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
            appeared_mine=True,
            my_mentions=[
                BrandMention(
                    original_text="InstantFlow",
                    normalized_name="InstantFlow",
                    brand_category="mine",
                    match_position=0,
                )
            ],
            competitor_mentions=[
                BrandMention(
                    original_text="Competitor1",
                    normalized_name="Competitor1",
                    brand_category="competitor",
                    match_position=18,
                )
            ],
            ranked_list=[
                RankedBrand(brand_name="InstantFlow", rank_position=1, confidence=1.0),
                RankedBrand(brand_name="Competitor1", rank_position=2, confidence=1.0),
            ],
            rank_extraction_method="pattern",
            rank_confidence=1.0,
        )

        # Run
        result = run_all(config)

        # Verify mentions were inserted (2 mentions total)
        assert mock_insert_mention.call_count == 2

        # Verify parsed answer JSON contains mentions
        parsed_file = os.path.join(
            result["output_dir"], "intent_intent1_parsed_openai_gpt-4o-mini.json"
        )
        with open(parsed_file, encoding="utf-8") as f:
            parsed_data = json.load(f)

        assert len(parsed_data["my_mentions"]) == 1
        assert len(parsed_data["competitor_mentions"]) == 1
        assert parsed_data["appeared_mine"] is True
        assert len(parsed_data["ranked_list"]) == 2
        assert parsed_data["ranked_list"][0]["brand_name"] == "InstantFlow"
        assert parsed_data["ranked_list"][1]["brand_name"] == "Competitor1"

    @freeze_time("2025-11-02 08:00:00")
    @patch("llm_answer_watcher.llm_runner.runner.build_client")
    @patch("llm_answer_watcher.llm_runner.runner.parse_answer")
    @patch("llm_answer_watcher.llm_runner.runner.insert_run")
    @patch("llm_answer_watcher.llm_runner.runner.insert_answer_raw")
    @patch("llm_answer_watcher.llm_runner.runner.insert_mention")
    def test_run_meta_contains_all_required_fields(
        self,
        mock_insert_mention,
        mock_insert_answer,
        mock_insert_run,
        mock_parse_answer,
        mock_build_client,
        tmp_path,
    ):
        """Test that run_meta.json contains all required fields."""
        config = create_test_config(
            my_brand="InstantFlow",
            my_brand_aliases=[],
            competitors=[],
            intents=[Intent(id="intent1", prompt="Prompt")],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
            output_dir=str(tmp_path / "output"),
            database_path=str(tmp_path / "test.db"),
        )

        # Mock LLM client
        mock_client = MagicMock()
        mock_client.generate_answer.return_value = LLMResponse(
            answer_text="Answer",
            tokens_used=75,  # 50 + 25
            cost_usd=0.000045,  # Estimated cost for 75 tokens
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
        )
        mock_build_client.return_value = mock_client

        # Mock parser - create function to return appropriate ExtractionResult
        def create_extraction_result(
            answer_text,
            brands,
            intent_id,
            provider,
            model_name,
            timestamp_utc,
            **kwargs,
        ):
            return ExtractionResult(
                intent_id=intent_id,
                model_provider=provider,
                model_name=model_name,
                timestamp_utc=timestamp_utc,
                appeared_mine=False,
                my_mentions=[],
                competitor_mentions=[],
                ranked_list=[],
                rank_extraction_method="pattern",
                rank_confidence=0.0,
            )

        mock_parse_answer.side_effect = create_extraction_result

        # Run
        result = run_all(config)

        # Read run_meta.json
        meta_file = os.path.join(result["output_dir"], "run_meta.json")
        with open(meta_file, encoding="utf-8") as f:
            meta = json.load(f)

        # Verify all required fields
        assert "run_id" in meta
        assert "timestamp_utc" in meta
        assert "output_dir" in meta
        assert "total_intents" in meta
        assert "total_models" in meta
        assert "total_queries" in meta
        assert "success_count" in meta
        assert "error_count" in meta
        assert "total_cost_usd" in meta
        assert "my_brands" in meta
        assert "database_path" in meta

        # Verify values
        assert meta["run_id"] == "2025-11-02T08-00-00Z"
        assert "InstantFlow" in meta["my_brands"]
        assert meta["total_intents"] == 1
        assert meta["total_models"] == 1

    @freeze_time("2025-11-02 08:00:00")
    @patch("llm_answer_watcher.llm_runner.runner.build_client")
    @patch("llm_answer_watcher.llm_runner.runner.parse_answer")
    @patch("llm_answer_watcher.llm_runner.runner.insert_run")
    @patch("llm_answer_watcher.llm_runner.runner.insert_answer_raw")
    @patch("llm_answer_watcher.llm_runner.runner.insert_mention")
    def test_progress_callback_called_for_each_query(
        self,
        mock_insert_mention,
        mock_insert_answer,
        mock_insert_run,
        mock_parse_answer,
        mock_build_client,
        tmp_path,
    ):
        """Test that progress callback is called after each query completes."""
        # Setup config with 2 intents x 2 models = 4 total queries
        config = create_test_config(
            my_brand="InstantFlow",
            intents=[
                Intent(id="intent1", prompt="Prompt 1"),
                Intent(id="intent2", prompt="Prompt 2"),
            ],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="key1",
                    system_prompt="You are a helpful assistant.",
                ),
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o",
                    api_key="key2",
                    system_prompt="You are a helpful assistant.",
                ),
            ],
            output_dir=str(tmp_path / "output"),
            database_path=str(tmp_path / "test.db"),
        )

        # Mock LLM client
        mock_client = MagicMock()
        mock_client.generate_answer.return_value = LLMResponse(
            answer_text="Test answer",
            tokens_used=75,
            cost_usd=0.000045,
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
        )
        mock_build_client.return_value = mock_client

        # Mock parser
        mock_parse_answer.return_value = ExtractionResult(
            intent_id="intent1",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
            appeared_mine=False,
            my_mentions=[],
            competitor_mentions=[],
            ranked_list=[],
            rank_extraction_method="pattern",
            rank_confidence=0.0,
        )

        # Create mock progress callback
        progress_callback = MagicMock()

        # Run with progress callback
        result = run_all(config, progress_callback=progress_callback)

        # Verify callback was called once per query (4 queries)
        assert progress_callback.call_count == 4
        assert result["total_queries"] == 4
        assert result["success_count"] == 4

    @freeze_time("2025-11-02 08:00:00")
    @patch("llm_answer_watcher.llm_runner.runner.build_client")
    @patch("llm_answer_watcher.llm_runner.runner.parse_answer")
    @patch("llm_answer_watcher.llm_runner.runner.insert_run")
    @patch("llm_answer_watcher.llm_runner.runner.insert_answer_raw")
    @patch("llm_answer_watcher.llm_runner.runner.insert_mention")
    def test_progress_callback_called_even_on_errors(
        self,
        mock_insert_mention,
        mock_insert_answer,
        mock_insert_run,
        mock_parse_answer,
        mock_build_client,
        tmp_path,
    ):
        """Test that progress callback is called even when queries fail."""
        # Setup config with 2 queries
        config = create_test_config(
            my_brand="InstantFlow",
            intents=[Intent(id="intent1", prompt="Prompt 1")],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="key1",
                    system_prompt="You are a helpful assistant.",
                ),
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o",
                    api_key="key2",
                    system_prompt="You are a helpful assistant.",
                ),
            ],
            output_dir=str(tmp_path / "output"),
            database_path=str(tmp_path / "test.db"),
        )

        # Mock LLM client - first call succeeds, second fails
        mock_client = MagicMock()
        mock_client.generate_answer.side_effect = [
            LLMResponse(
                answer_text="Success",
                tokens_used=75,
                cost_usd=0.000045,
                provider="openai",
                model_name="gpt-4o-mini",
                timestamp_utc="2025-11-02T08:00:00Z",
            ),
            Exception("API error"),
        ]
        mock_build_client.return_value = mock_client

        # Mock parser
        mock_parse_answer.return_value = ExtractionResult(
            intent_id="intent1",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
            appeared_mine=False,
            my_mentions=[],
            competitor_mentions=[],
            ranked_list=[],
            rank_extraction_method="pattern",
            rank_confidence=0.0,
        )

        # Create mock progress callback
        progress_callback = MagicMock()

        # Run with progress callback
        result = run_all(config, progress_callback=progress_callback)

        # Verify callback was called for both successful and failed queries
        assert progress_callback.call_count == 2
        assert result["total_queries"] == 2
        assert result["success_count"] == 1
        assert result["error_count"] == 1
