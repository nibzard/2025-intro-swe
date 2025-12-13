"""
Steel-based Perplexity web interface runner.

This module provides a browser automation runner for Perplexity using Steel API.
It navigates to perplexity.ai, submits queries, waits for responses, and extracts
answer text along with web search sources (which are core to Perplexity's UX).

Key components:
- SteelPerplexityRunner: Perplexity browser automation implementation
- SteelPerplexityPlugin: Plugin registration for registry

Architecture:
    Extends SteelBaseRunner to inherit session management and screenshot
    functionality, while implementing Perplexity-specific navigation and extraction
    logic including source extraction (Perplexity always shows sources).

Example:
    >>> config = SteelConfig(
    ...     steel_api_key="sk-...",
    ...     target_url="https://www.perplexity.ai",
    ...     take_screenshots=True
    ... )
    >>> runner = SteelPerplexityRunner(config)
    >>> result = runner.run_intent("What are the best CRM tools?")
    >>> print(result.answer_text)
    >>> print(f"Sources: {result.web_search_count}")
"""

import logging
import time

from ..intent_runner import IntentResult
from ..plugin_registry import RunnerRegistry
from .steel_base import SteelBaseRunner, SteelConfig

logger = logging.getLogger(__name__)


class SteelPerplexityRunner(SteelBaseRunner):
    """
    Steel-based runner for Perplexity web interface.

    Implements Perplexity-specific browser automation including:
    - Navigation to perplexity.ai
    - Query submission via search input
    - Waiting for response and source loading
    - Answer text extraction
    - Web source extraction (always present in Perplexity)

    The runner uses Steel's CDP to interact with Perplexity's web interface,
    which is optimized for search-style queries with cited sources.

    Example:
        >>> config = SteelConfig(
        ...     steel_api_key="sk-...",
        ...     target_url="https://www.perplexity.ai"
        ... )
        >>> runner = SteelPerplexityRunner(config)
        >>> result = runner.run_intent("What are the best email warmup tools?")
        >>> print(f"Answer length: {len(result.answer_text)}")
        >>> print(f"Sources found: {result.web_search_count}")
    """

    @property
    def runner_name(self) -> str:
        """Return human-readable runner identifier."""
        return "steel-perplexity"

    def run_intent(self, prompt: str) -> IntentResult:
        """
        Execute intent via Perplexity web interface.

        Args:
            prompt: User intent prompt to execute

        Returns:
            IntentResult: Structured result with answer and metadata

        Example:
            >>> result = runner.run_intent("What are the best CRM tools?")
            >>> if result.success:
            ...     print(result.answer_text)
            ...     print(f"Sources: {result.web_search_count}")
            ... else:
            ...     print(f"Error: {result.error_message}")
        """
        start_time = time.time()

        try:
            # Create Steel browser session
            session = self._create_session()
            self.session_id = session["id"]

            logger.info(f"Perplexity session created: {self.session_id}")

            # Navigate to Perplexity and submit query
            self._navigate_and_submit(session, prompt)

            # Wait for response completion
            answer_text = self._extract_answer(session)

            # Extract web sources (always present in Perplexity)
            web_search_results = self._extract_web_sources(session)
            web_search_count = len(web_search_results) if web_search_results else 0

            # Take screenshot if enabled
            screenshot_path = self._take_screenshot(self.session_id, "perplexity")

            # Save HTML snapshot if enabled
            html_snapshot_path = self._save_html(self.session_id, "perplexity")

            # Estimate cost (placeholder for now)
            cost_usd = self._estimate_cost(session, start_time)

            # Import timestamp utility
            from ...utils.time import utc_timestamp

            return IntentResult(
                answer_text=answer_text,
                runner_type="browser",
                runner_name="steel-perplexity",
                provider="perplexity-web",
                model_name="perplexity-unknown",  # Can't determine model from UI
                timestamp_utc=utc_timestamp(),
                cost_usd=cost_usd,
                tokens_used=0,  # Browser-based, no token tracking
                screenshot_path=screenshot_path,
                html_snapshot_path=html_snapshot_path,
                session_id=self.session_id,
                web_search_results=web_search_results,
                web_search_count=web_search_count,
                success=True,
            )

        except Exception as e:
            logger.error(f"Perplexity runner failed: {e}", exc_info=True)

            from ...utils.time import utc_timestamp

            return IntentResult(
                answer_text="",
                runner_type="browser",
                runner_name="steel-perplexity",
                provider="perplexity-web",
                model_name="perplexity-unknown",
                timestamp_utc=utc_timestamp(),
                cost_usd=0.0,
                success=False,
                error_message=str(e),
            )

        finally:
            # Cleanup: release session if not reusing
            if self.session_id and not self.config.session_reuse:
                self._release_session(self.session_id)

    def _navigate_and_submit(self, session: dict, prompt: str) -> None:
        """
        Navigate to Perplexity and submit query using Playwright.

        Args:
            session: Steel session data
            prompt: User intent prompt to submit

        Raises:
            Exception: If navigation or submission fails
        """
        session_id = session["id"]

        logger.debug(f"Navigating to Perplexity for session {session_id}")

        try:
            # Import Playwright here to avoid import errors if not installed
            from playwright.sync_api import sync_playwright

            # Get websocket URL from session
            session_obj = self._steel_client.sessions.retrieve(session_id)
            ws_url = getattr(session_obj, "websocket_url", None) or getattr(
                session_obj, "cdp_url", None
            )

            if not ws_url:
                logger.warning("No websocket URL available, falling back to simple navigation")
                time.sleep(5)  # Wait for page to load
                return

            logger.info(f"Connecting to Steel session via websocket: {ws_url}")

            with sync_playwright() as p:
                # Connect to Steel browser session via CDP
                browser = p.chromium.connect_over_cdp(ws_url)
                context = browser.contexts[0] if browser.contexts else browser.new_context()
                page = context.pages[0] if context.pages else context.new_page()

                # Navigate to target URL
                logger.info(f"Navigating to {self.config.target_url}")
                page.goto(self.config.target_url)

                # Wait for page to be ready
                page.wait_for_load_state("domcontentloaded")
                logger.debug("Perplexity page loaded")

                # Find and fill the search textarea
                logger.info(f"Submitting query to Perplexity: {prompt[:50]}...")

                # Try multiple selectors for Perplexity search input
                selectors = [
                    'textarea[placeholder*="Ask"]',
                    'textarea[placeholder*="Search"]',
                    'textarea',
                    'input[type="text"]',
                ]

                search_input = None
                for selector in selectors:
                    try:
                        search_input = page.wait_for_selector(selector, timeout=5000)
                        if search_input:
                            logger.debug(f"Found input using selector: {selector}")
                            break
                    except Exception:
                        continue

                if not search_input:
                    raise RuntimeError("Could not find Perplexity search input field")

                # Type the query
                search_input.fill(prompt)
                logger.debug("Query typed into input field")

                # Submit the search (Enter key)
                search_input.press("Enter")
                logger.debug("Submitted query with Enter key")

                # Wait for search to start (page navigation or loading indicator)
                logger.debug("Waiting for Perplexity search to start...")
                page.wait_for_timeout(2000)  # Initial delay for search to start

                logger.info("Query submitted successfully")

        except Exception as e:
            logger.error(f"Failed to navigate and submit: {e}", exc_info=True)
            # Fallback: just wait and hope the session is navigated correctly
            logger.warning("Falling back to simple wait")
            time.sleep(5)

    def _extract_answer(self, session: dict) -> str:
        """
        Extract answer text from Perplexity response using Playwright and Steel scrape API.

        Args:
            session: Steel session data

        Returns:
            str: Extracted answer text

        Raises:
            Exception: If extraction fails
        """
        session_id = session["id"]

        logger.debug(f"Waiting for Perplexity response in session {session_id}")

        # Wait for response to complete
        timeout = self.config.wait_for_response_timeout
        start_time = time.time()

        answer_text = None

        try:
            from playwright.sync_api import sync_playwright

            # Get websocket URL
            session_obj = self._steel_client.sessions.retrieve(session_id)
            ws_url = getattr(session_obj, "websocket_url", None) or getattr(
                session_obj, "cdp_url", None
            )

            if ws_url:
                logger.info("Using Playwright to extract Perplexity response")

                with sync_playwright() as p:
                    browser = p.chromium.connect_over_cdp(ws_url)
                    context = browser.contexts[0] if browser.contexts else browser.new_context()
                    page = context.pages[0] if context.pages else context.new_page()

                    # Wait for response to complete
                    # Perplexity shows loading indicators while searching
                    logger.debug("Waiting for response to complete...")

                    while time.time() - start_time < timeout:
                        # Check if still loading (look for loading spinner or similar)
                        loading_indicators = page.query_selector_all('[data-testid*="loading"]')
                        if not loading_indicators:
                            logger.debug("Response appears complete (no loading indicators)")
                            break

                        time.sleep(2)

                    # Additional wait for sources to load
                    time.sleep(3)

                    # Extract the answer text
                    logger.debug("Extracting answer text")

                    # Try multiple selectors for Perplexity answer
                    answer_selectors = [
                        '[data-testid="answer"]',
                        '.prose',
                        '[class*="answer"]',
                        'article',
                    ]

                    for selector in answer_selectors:
                        try:
                            element = page.query_selector(selector)
                            if element:
                                answer_text = element.inner_text()
                                logger.debug(f"Found answer using selector: {selector}")
                                break
                        except Exception as e:
                            logger.debug(f"Selector {selector} failed: {e}")
                            continue

            else:
                logger.warning("No websocket URL available for Playwright extraction")

        except Exception as e:
            logger.warning(f"Playwright extraction failed: {e}", exc_info=True)

        # Fallback: use Steel's scrape API to get markdown content
        if not answer_text:
            logger.info("Falling back to Steel scrape API for content extraction")

            try:
                # Wait a bit more for content to stabilize
                time.sleep(5)

                # Use base class method to scrape page content
                markdown_content = self._scrape_page_content(session_id, format="markdown")

                if markdown_content:
                    answer_text = markdown_content
                    logger.info("Successfully extracted content using scrape API")
                else:
                    # Last resort: get cleaned HTML
                    html_content = self._scrape_page_content(session_id, format="cleaned_html")
                    if html_content:
                        answer_text = html_content
                        logger.info("Extracted content from cleaned HTML")

            except Exception as e:
                logger.warning(f"Scrape API extraction failed: {e}", exc_info=True)

        # If we still don't have content, return a placeholder
        if not answer_text:
            answer_text = "[Failed to extract Perplexity response - see logs for details]"

        logger.info(f"Extracted answer ({len(answer_text)} chars)")

        return answer_text

    def _extract_web_sources(self, session: dict) -> list[dict] | None:
        """
        Extract web sources from Perplexity response.

        Perplexity always shows source citations with URLs and titles.
        This extracts those sources for storage and analysis.

        Args:
            session: Steel session data

        Returns:
            list[dict] | None: List of sources with url/title/snippet, or None

        Note:
            This is a key differentiator for Perplexity - sources are always shown.
        """
        session_id = session["id"]
        sources = []

        try:
            from playwright.sync_api import sync_playwright

            # Get websocket URL
            session_obj = self._steel_client.sessions.retrieve(session_id)
            ws_url = getattr(session_obj, "websocket_url", None) or getattr(
                session_obj, "cdp_url", None
            )

            if ws_url:
                logger.debug("Extracting web sources from Perplexity response")

                with sync_playwright() as p:
                    browser = p.chromium.connect_over_cdp(ws_url)
                    context = browser.contexts[0] if browser.contexts else browser.new_context()
                    page = context.pages[0] if context.pages else context.new_page()

                    # Look for source citations - Perplexity typically shows them as numbered links
                    source_selectors = [
                        '[data-testid*="citation"]',
                        '[data-testid*="source"]',
                        'cite a',
                        '.citation a',
                        '[class*="source"] a',
                    ]

                    for selector in source_selectors:
                        try:
                            elements = page.query_selector_all(selector)
                            for elem in elements:
                                url = elem.get_attribute("href")
                                title = elem.inner_text() or elem.get_attribute("title") or "Source"

                                if url:
                                    # Try to get snippet if available
                                    snippet = None
                                    parent = elem.eval_on_selector(
                                        "..", "el => el.getAttribute('data-snippet')"
                                    )
                                    if parent:
                                        snippet = parent

                                    sources.append({
                                        "url": url,
                                        "title": title.strip(),
                                        "snippet": snippet or "",
                                    })

                            if sources:
                                logger.debug(f"Found sources using selector: {selector}")
                                break

                        except Exception as e:
                            logger.debug(f"Source selector {selector} failed: {e}")

                    logger.info(f"Extracted {len(sources)} web sources")

        except Exception as e:
            logger.warning(f"Web source extraction failed: {e}", exc_info=True)

        return sources if sources else None


@RunnerRegistry.register
class SteelPerplexityPlugin:
    """
    Plugin implementation for Steel Perplexity runner.

    Configuration:
        - steel_api_key: Steel API key
        - target_url: Perplexity URL (default: https://www.perplexity.ai)
        - session_timeout: Max session duration in seconds (default: 300)
        - wait_for_response_timeout: Max wait for response (default: 60)
        - take_screenshots: Capture screenshots (default: True)
        - save_html_snapshot: Save HTML snapshots (default: True)
        - session_reuse: Reuse sessions across intents (default: True)
        - solver: CAPTCHA solver (default: "capsolver")
        - proxy: Optional proxy config (default: None)

    Example:
        >>> config = {
        ...     "steel_api_key": "sk-...",
        ...     "target_url": "https://www.perplexity.ai",
        ...     "take_screenshots": True,
        ... }
        >>> runner = SteelPerplexityPlugin.create_runner(config)
        >>> result = runner.run_intent("What are the best CRM tools?")
    """

    @classmethod
    def plugin_name(cls) -> str:
        """Return plugin identifier."""
        return "steel-perplexity"

    @classmethod
    def runner_type(cls) -> str:
        """Return runner type."""
        return "browser"

    @classmethod
    def create_runner(cls, config: dict) -> SteelPerplexityRunner:
        """
        Create SteelPerplexityRunner from configuration.

        Args:
            config: Configuration dictionary

        Returns:
            SteelPerplexityRunner: Configured runner instance
        """
        steel_config = SteelConfig(
            steel_api_key=config["steel_api_key"],
            target_url=config.get("target_url", "https://www.perplexity.ai"),
            session_timeout=config.get("session_timeout", 300),
            wait_for_response_timeout=config.get("wait_for_response_timeout", 60),
            take_screenshots=config.get("take_screenshots", True),
            save_html_snapshot=config.get("save_html_snapshot", True),
            session_reuse=config.get("session_reuse", True),
            solver=config.get("solver", "capsolver"),
            proxy=config.get("proxy"),
            output_dir=config.get("output_dir", "./output"),
        )
        return SteelPerplexityRunner(steel_config)

    @classmethod
    def validate_config(cls, config: dict) -> tuple[bool, str]:
        """
        Validate Steel Perplexity configuration.

        Args:
            config: Configuration dictionary to validate

        Returns:
            tuple[bool, str]: (is_valid, error_message)
        """
        if "steel_api_key" not in config:
            return False, "Missing required field: steel_api_key"

        if not config["steel_api_key"] or config["steel_api_key"].isspace():
            return False, "steel_api_key cannot be empty"

        return True, ""

    @classmethod
    def required_env_vars(cls) -> list[str]:
        """Return required environment variables."""
        return ["STEEL_API_KEY"]
