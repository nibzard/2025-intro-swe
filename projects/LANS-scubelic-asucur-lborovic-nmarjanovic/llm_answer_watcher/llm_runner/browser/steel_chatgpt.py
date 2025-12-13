"""
Steel-based ChatGPT web interface runner.

This module provides a browser automation runner for ChatGPT using Steel API.
It navigates to chat.openai.com, submits prompts, waits for responses, and
extracts answer text along with optional web search results.

Key components:
- SteelChatGPTRunner: ChatGPT browser automation implementation
- SteelChatGPTPlugin: Plugin registration for registry

Architecture:
    Extends SteelBaseRunner to inherit session management and screenshot
    functionality, while implementing ChatGPT-specific navigation and extraction
    logic using Steel's browser control API.

Example:
    >>> config = SteelConfig(
    ...     steel_api_key="sk-...",
    ...     target_url="https://chat.openai.com",
    ...     take_screenshots=True
    ... )
    >>> runner = SteelChatGPTRunner(config)
    >>> result = runner.run_intent("What are the best CRM tools?")
    >>> print(result.answer_text)
    >>> print(f"Screenshot: {result.screenshot_path}")
"""

import logging
import time

from ..intent_runner import IntentResult
from ..plugin_registry import RunnerRegistry
from .steel_base import SteelBaseRunner, SteelConfig

logger = logging.getLogger(__name__)


class SteelChatGPTRunner(SteelBaseRunner):
    """
    Steel-based runner for ChatGPT web interface.

    Implements ChatGPT-specific browser automation including:
    - Navigation to chat.openai.com
    - Prompt submission via text input
    - Waiting for response completion
    - Answer text extraction
    - Optional web search result extraction

    The runner uses Steel's CDP (Chrome DevTools Protocol) to interact with
    ChatGPT's web interface, handling dynamic content and waiting for streaming
    responses to complete.

    Example:
        >>> config = SteelConfig(
        ...     steel_api_key="sk-...",
        ...     target_url="https://chat.openai.com"
        ... )
        >>> runner = SteelChatGPTRunner(config)
        >>> result = runner.run_intent("What are the best email warmup tools?")
        >>> print(f"Answer length: {len(result.answer_text)}")
        >>> print(f"Web searches: {result.web_search_count}")
    """

    @property
    def runner_name(self) -> str:
        """Return human-readable runner identifier."""
        return "steel-chatgpt"

    def run_intent(self, prompt: str) -> IntentResult:
        """
        Execute intent via ChatGPT web interface.

        Args:
            prompt: User intent prompt to execute

        Returns:
            IntentResult: Structured result with answer and metadata

        Example:
            >>> result = runner.run_intent("What are the best CRM tools?")
            >>> if result.success:
            ...     print(result.answer_text)
            ... else:
            ...     print(f"Error: {result.error_message}")
        """
        start_time = time.time()

        try:
            # Create Steel browser session
            session = self._create_session()
            self.session_id = session["id"]

            logger.info(f"ChatGPT session created: {self.session_id}")

            # Navigate to ChatGPT and submit prompt
            self._navigate_and_submit(session, prompt)

            # Wait for response completion
            answer_text = self._extract_answer(session)

            # Extract web search results if present (future enhancement)
            web_search_results = self._extract_web_sources(session)
            web_search_count = len(web_search_results) if web_search_results else 0

            # Take screenshot if enabled
            screenshot_path = self._take_screenshot(self.session_id, "chatgpt")

            # Save HTML snapshot if enabled
            html_snapshot_path = self._save_html(self.session_id, "chatgpt")

            # Estimate cost (placeholder for now)
            cost_usd = self._estimate_cost(session, start_time)

            # Import timestamp utility
            from ...utils.time import utc_timestamp

            return IntentResult(
                answer_text=answer_text,
                runner_type="browser",
                runner_name="steel-chatgpt",
                provider="chatgpt-web",
                model_name="chatgpt-unknown",  # Can't determine model from UI
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
            logger.error(f"ChatGPT runner failed: {e}", exc_info=True)

            from ...utils.time import utc_timestamp

            return IntentResult(
                answer_text="",
                runner_type="browser",
                runner_name="steel-chatgpt",
                provider="chatgpt-web",
                model_name="chatgpt-unknown",
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
        Navigate to ChatGPT and submit prompt using Playwright.

        Args:
            session: Steel session data
            prompt: User intent prompt to submit

        Raises:
            Exception: If navigation or submission fails
        """
        session_id = session["id"]

        logger.debug(f"Navigating to ChatGPT for session {session_id}")

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
                logger.debug("ChatGPT page loaded")

                # Find and fill the message textarea
                logger.info(f"Submitting prompt to ChatGPT: {prompt[:50]}...")

                # Try multiple selectors for ChatGPT input
                selectors = [
                    'textarea[placeholder*="Message"]',
                    'textarea[id*="prompt"]',
                    'textarea',
                    '#prompt-textarea',
                ]

                text_area = None
                for selector in selectors:
                    try:
                        text_area = page.wait_for_selector(selector, timeout=5000)
                        if text_area:
                            logger.debug(f"Found input using selector: {selector}")
                            break
                    except Exception:
                        continue

                if not text_area:
                    raise RuntimeError("Could not find ChatGPT message input field")

                # Type the prompt
                text_area.fill(prompt)
                logger.debug("Prompt typed into input field")

                # Submit the message (Enter key or click button)
                # Try Enter key first
                text_area.press("Enter")
                logger.debug("Submitted prompt with Enter key")

                # Wait for response to start (look for assistant message)
                logger.debug("Waiting for ChatGPT response to start...")
                page.wait_for_timeout(2000)  # Initial delay for response to start

                logger.info("Prompt submitted successfully")

        except Exception as e:
            logger.error(f"Failed to navigate and submit: {e}", exc_info=True)
            # Fallback: just wait and hope the session is navigated correctly
            logger.warning("Falling back to simple wait")
            time.sleep(5)

    def _extract_answer(self, session: dict) -> str:
        """
        Extract answer text from ChatGPT response using Playwright and Steel scrape API.

        Args:
            session: Steel session data

        Returns:
            str: Extracted answer text

        Raises:
            Exception: If extraction fails
        """
        session_id = session["id"]

        logger.debug(f"Waiting for ChatGPT response in session {session_id}")

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
                logger.info("Using Playwright to extract ChatGPT response")

                with sync_playwright() as p:
                    browser = p.chromium.connect_over_cdp(ws_url)
                    context = browser.contexts[0] if browser.contexts else browser.new_context()
                    page = context.pages[0] if context.pages else context.new_page()

                    # Wait for streaming to complete
                    # Look for absence of "Stop generating" button or similar indicators
                    logger.debug("Waiting for response to complete...")

                    while time.time() - start_time < timeout:
                        # Check if still generating
                        stop_button = page.query_selector('button:has-text("Stop generating")')
                        if not stop_button:
                            logger.debug("Response appears complete (no stop button)")
                            break

                        time.sleep(2)

                    # Extract the last assistant message
                    logger.debug("Extracting answer text")

                    # Try multiple selectors for ChatGPT response
                    response_selectors = [
                        '[data-message-author-role="assistant"]:last-of-type',
                        '.markdown:last-of-type',
                        '[data-testid*="conversation-turn"]:last-child',
                    ]

                    for selector in response_selectors:
                        try:
                            element = page.query_selector(selector)
                            if element:
                                answer_text = element.inner_text()
                                logger.debug(f"Found response using selector: {selector}")
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
                    # Last resort: get HTML and extract text
                    html_content = self._scrape_page_content(session_id, format="cleaned_html")
                    if html_content:
                        answer_text = html_content
                        logger.info("Extracted content from cleaned HTML")

            except Exception as e:
                logger.warning(f"Scrape API extraction failed: {e}", exc_info=True)

        # If we still don't have content, return a placeholder
        if not answer_text:
            answer_text = "[Failed to extract ChatGPT response - see logs for details]"

        logger.info(f"Extracted answer ({len(answer_text)} chars)")

        return answer_text

    def _extract_web_sources(self, session: dict) -> list[dict] | None:
        """
        Extract web search results if ChatGPT used web search.

        Looks for citation links or "Searched X sites" indicators in response.

        Args:
            session: Steel session data

        Returns:
            list[dict] | None: List of web sources with url/title, or None
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
                logger.debug("Extracting web sources from ChatGPT response")

                with sync_playwright() as p:
                    browser = p.chromium.connect_over_cdp(ws_url)
                    context = browser.contexts[0] if browser.contexts else browser.new_context()
                    page = context.pages[0] if context.pages else context.new_page()

                    # Look for citation links
                    citation_selectors = [
                        'a[href*="link/"]',  # ChatGPT citation links
                        'sup a',  # Superscript citation links
                        '[data-testid*="citation"]',
                    ]

                    for selector in citation_selectors:
                        try:
                            elements = page.query_selector_all(selector)
                            for elem in elements:
                                url = elem.get_attribute("href")
                                title = elem.inner_text() or "Source"
                                if url:
                                    sources.append({"url": url, "title": title.strip()})
                        except Exception as e:
                            logger.debug(f"Citation selector {selector} failed: {e}")

                    logger.info(f"Extracted {len(sources)} web sources")

        except Exception as e:
            logger.warning(f"Web source extraction failed: {e}", exc_info=True)

        return sources if sources else None


@RunnerRegistry.register
class SteelChatGPTPlugin:
    """
    Plugin implementation for Steel ChatGPT runner.

    Configuration:
        - steel_api_key: Steel API key
        - target_url: ChatGPT URL (default: https://chat.openai.com)
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
        ...     "target_url": "https://chat.openai.com",
        ...     "take_screenshots": True,
        ... }
        >>> runner = SteelChatGPTPlugin.create_runner(config)
        >>> result = runner.run_intent("What are the best CRM tools?")
    """

    @classmethod
    def plugin_name(cls) -> str:
        """Return plugin identifier."""
        return "steel-chatgpt"

    @classmethod
    def runner_type(cls) -> str:
        """Return runner type."""
        return "browser"

    @classmethod
    def create_runner(cls, config: dict) -> SteelChatGPTRunner:
        """
        Create SteelChatGPTRunner from configuration.

        Args:
            config: Configuration dictionary

        Returns:
            SteelChatGPTRunner: Configured runner instance
        """
        steel_config = SteelConfig(
            steel_api_key=config["steel_api_key"],
            target_url=config.get("target_url", "https://chat.openai.com"),
            session_timeout=config.get("session_timeout", 300),
            wait_for_response_timeout=config.get("wait_for_response_timeout", 60),
            take_screenshots=config.get("take_screenshots", True),
            save_html_snapshot=config.get("save_html_snapshot", True),
            session_reuse=config.get("session_reuse", True),
            solver=config.get("solver", "capsolver"),
            proxy=config.get("proxy"),
            output_dir=config.get("output_dir", "./output"),
        )
        return SteelChatGPTRunner(steel_config)

    @classmethod
    def validate_config(cls, config: dict) -> tuple[bool, str]:
        """
        Validate Steel ChatGPT configuration.

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
