#!/usr/bin/env python3
"""
Automated brand monitoring script for cron jobs.

This script runs LLM Answer Watcher on a schedule and handles:
- Configuration loading
- Error handling with proper exit codes
- Optional alerting on rank changes
- Logging for debugging

Usage:
    # Run manually
    python examples/code-examples/automated_monitoring.py

    # Add to crontab for daily monitoring at 9 AM
    0 9 * * * /path/to/automated_monitoring.py

Exit codes:
    0 - Success (all queries completed)
    1 - Configuration error
    2 - Database error
    3 - Partial failure (some queries failed)
    4 - Complete failure (no queries succeeded)
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from llm_answer_watcher.config.loader import load_config
from llm_answer_watcher.llm_runner.runner import run_all


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('llm_monitoring.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


async def main():
    """Main monitoring workflow."""
    # Configuration file path (customize as needed)
    config_path = "examples/07-real-world/saas-brand-monitoring.config.yaml"

    logger.info("=" * 80)
    logger.info("LLM ANSWER WATCHER - AUTOMATED MONITORING")
    logger.info("=" * 80)

    # Load configuration
    try:
        logger.info(f"Loading configuration from {config_path}")
        config = load_config(config_path)
    except FileNotFoundError:
        logger.error(f"Configuration file not found: {config_path}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)

    # Run all queries
    try:
        logger.info("Starting LLM queries...")
        result = await run_all(config)

        # Log results
        logger.info("-" * 80)
        logger.info("RUN COMPLETE")
        logger.info("-" * 80)
        logger.info(f"Run ID: {result['run_id']}")
        logger.info(f"Total queries: {result['total_queries']}")
        logger.info(f"Successful: {result['success_count']}")
        logger.info(f"Failed: {result['error_count']}")
        logger.info(f"Total cost: ${result['total_cost_usd']:.4f}")
        logger.info(f"Output: {result['output_dir']}")

        # Determine exit code based on results
        if result['error_count'] == 0:
            logger.info("✅ All queries completed successfully")
            sys.exit(0)
        elif result['success_count'] > 0:
            logger.warning(f"⚠️  Partial failure: {result['error_count']} queries failed")
            # Log errors
            for error in result.get('errors', []):
                logger.error(
                    f"  - Intent: {error['intent_id']}, "
                    f"Provider: {error['model_provider']}, "
                    f"Error: {error['error_message']}"
                )
            sys.exit(3)
        else:
            logger.error("❌ Complete failure: No queries succeeded")
            sys.exit(4)

    except Exception as e:
        logger.error(f"Unexpected error during execution: {e}", exc_info=True)
        sys.exit(4)


if __name__ == "__main__":
    asyncio.run(main())
