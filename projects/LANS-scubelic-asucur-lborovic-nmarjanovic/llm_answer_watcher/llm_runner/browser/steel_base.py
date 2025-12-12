"""
Base class for Steel API browser automation runners.

This module provides common functionality for all Steel-based browser runners
including session management, navigation, screenshot capture, and HTML extraction.

Key components:
- SteelConfig: Configuration dataclass for Steel API settings
- SteelBaseRunner: Base class with common Steel operations

Architecture:
    The base class handles Steel API interactions (session creation, cleanup,
    screenshot capture) while concrete implementations (ChatGPT, Perplexity)
    override site-specific methods for navigation and content extraction.

Example:
    >>> class MyChatRunner(SteelBaseRunner):
    ...     def _navigate_and_submit(self, session: dict, prompt: str):
    ...         # Site-specific navigation
    ...         pass
    ...
    ...     def _extract_answer(self, session: dict) -> str:
    ...         # Site-specific extraction
    ...         pass
    ...
    >>> config = SteelConfig(steel_api_key="sk-...", target_url="https://example.com")
    >>> runner = MyChatRunner(config)
    >>> result = runner.run_intent("What are the best CRM tools?")
"""

import base64
import logging
import time
from dataclasses import dataclass
from pathlib import Path

try:
    from steel import Steel
except ImportError:
    Steel = None

from ...utils.time import utc_timestamp

logger = logging.getLogger(__name__)


@dataclass
class SteelConfig:
    """
    Configuration for Steel browser automation.

    Attributes:
        steel_api_key: Steel API key for authentication
        target_url: Starting URL for browser session
        session_timeout: Maximum session duration in seconds (default: 300)
        wait_for_response_timeout: Max wait for response in seconds (default: 60)
        take_screenshots: Whether to capture screenshots (default: True)
        save_html_snapshot: Whether to save HTML snapshots (default: True)
        session_reuse: Whether to reuse sessions (default: True)
        solver: CAPTCHA solver service (default: "capsolver")
        proxy: Optional proxy configuration (default: None)
        output_dir: Directory for saving screenshots/HTML (default: "./output")
    """

    steel_api_key: str
    target_url: str
    session_timeout: int = 300
    wait_for_response_timeout: int = 60
    take_screenshots: bool = True
    save_html_snapshot: bool = True
    session_reuse: bool = True
    solver: str = "capsolver"
    proxy: str | None = None
    output_dir: str = "./output"


class SteelBaseRunner:
    """
    Base class for Steel API browser automation runners.

    Provides common Steel API operations including:
    - Session creation and cleanup
    - Screenshot capture
    - HTML snapshot extraction
    - Error handling and retry logic

    Subclasses must implement:
    - _navigate_and_submit(): Site-specific navigation and prompt submission
    - _extract_answer(): Site-specific answer extraction
    - runner_name property: Human-readable identifier

    Attributes:
        config: Steel configuration
        steel_api_url: Steel API base URL
        session_id: Current browser session ID (if active)
        _client: HTTP client for Steel API calls

    Example:
        >>> class MyRunner(SteelBaseRunner):
        ...     @property
        ...     def runner_name(self) -> str:
        ...         return "my-steel-runner"
        ...
        ...     def _navigate_and_submit(self, session: dict, prompt: str):
        ...         # Navigate to site and submit prompt
        ...         pass
        ...
        ...     def _extract_answer(self, session: dict) -> str:
        ...         # Extract answer from page
        ...         return "Extracted answer text"
        ...
        >>> config = SteelConfig(steel_api_key="sk-...", target_url="https://example.com")
        >>> runner = MyRunner(config)
        >>> result = runner.run_intent("What are the best CRM tools?")
    """

    def __init__(self, config: SteelConfig):
        """
        Initialize Steel base runner.

        Args:
            config: Steel configuration

        Raises:
            ImportError: If steel-sdk is not installed
        """
        if Steel is None:
            raise ImportError(
                "Steel SDK is not installed. Install it with: pip install steel-sdk"
            )

        self.config = config
        self.session_id: str | None = None
        self._steel_client = Steel(steel_api_key=config.steel_api_key)
        self._current_session = None

    @property
    def runner_type(self) -> str:
        """Return runner type (always 'browser' for Steel runners)."""
        return "browser"

    @property
    def runner_name(self) -> str:
        """Return human-readable runner identifier (must be overridden)."""
        raise NotImplementedError("Subclasses must implement runner_name property")

    def _create_session(self) -> dict:
        """
        Create Steel browser session using Steel SDK.

        Returns:
            dict: Session data from Steel API with keys:
                - id: Session identifier
                - cdp_url: CDP WebSocket URL for Playwright
                - status: Session status

        Raises:
            Exception: If session creation fails

        Note:
            Steel sessions are created blank. Navigation to target_url
            happens separately via Playwright CDP or scrape API calls.
        """
        logger.debug(f"Creating Steel session (will navigate to {self.config.target_url})")

        try:
            # Create session using Steel SDK
            # Note: sessions.create() doesn't take a 'url' parameter
            # Sessions are created blank and you navigate via Playwright/scrape API
            create_params = {
                "api_timeout": self.config.session_timeout,
            }

            # Only add solve_captcha if solver is configured (not available on hobby plan)
            if self.config.solver and self.config.solver != "capsolver":
                # Hobby plan doesn't support captcha solving
                logger.warning("CAPTCHA solving requires paid plan, skipping")

            # Only add proxy if configured
            if self.config.proxy:
                create_params["use_proxy"] = {"value": self.config.proxy}

            session = self._steel_client.sessions.create(**create_params)

            # Convert to dict for consistent interface
            session_data = {
                "id": session.id,
                "cdp_url": getattr(session, "cdp_url", None) or getattr(session, "websocket_url", None),
                "status": getattr(session, "status", "created"),
                "url": self.config.target_url,  # Store target URL for navigation
            }

            logger.info(f"Created Steel session: {session_data['id']}")
            self._current_session = session

            return session_data

        except Exception as e:
            logger.error(f"Failed to create Steel session: {e}")
            raise

    def _release_session(self, session_id: str) -> None:
        """
        Release Steel browser session using Steel SDK.

        Args:
            session_id: Session identifier to release

        Note:
            Errors are logged but not raised to avoid breaking cleanup logic.
        """
        try:
            logger.debug(f"Releasing Steel session: {session_id}")
            self._steel_client.sessions.release(session_id)
            logger.info(f"Released Steel session: {session_id}")
            self._current_session = None
        except Exception as e:
            logger.warning(f"Failed to release session {session_id}: {e}")

    def _take_screenshot(self, session_id: str, intent_id: str) -> str | None:
        """
        Capture screenshot using Steel SDK screenshot API.

        Args:
            session_id: Session identifier
            intent_id: Intent identifier (for filename)

        Returns:
            str | None: Path to saved screenshot, or None if capture failed

        Note:
            Uses Steel's screenshot API which captures the current page state.
        """
        if not self.config.take_screenshots:
            return None

        try:
            logger.debug(f"Taking screenshot for session {session_id}")

            # Use Steel's screenshot API - pass the session's current URL
            # Get the session to retrieve its current URL
            session = self._steel_client.sessions.retrieve(session_id)
            current_url = getattr(session, "url", self.config.target_url)

            # Call Steel screenshot API
            screenshot_response = self._steel_client.screenshot(
                url=current_url, session_id=session_id
            )

            # Extract screenshot data
            screenshot_data = getattr(screenshot_response, "data", None) or getattr(
                screenshot_response, "image", None
            )

            if not screenshot_data:
                logger.warning("Screenshot response missing image data")
                return None

            # Handle different response formats
            if isinstance(screenshot_data, bytes):
                image_bytes = screenshot_data
            elif isinstance(screenshot_data, str):
                # Base64 encoded
                image_bytes = base64.b64decode(screenshot_data)
            else:
                logger.warning(f"Unexpected screenshot data type: {type(screenshot_data)}")
                return None

            # Save screenshot
            output_dir = Path(self.config.output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)

            screenshot_path = output_dir / f"screenshot_{intent_id}_{session_id}.png"
            screenshot_path.write_bytes(image_bytes)

            logger.info(f"Saved screenshot: {screenshot_path}")
            return str(screenshot_path)

        except Exception as e:
            logger.warning(f"Failed to capture screenshot: {e}", exc_info=True)
            return None

    def _save_html(self, session_id: str, intent_id: str) -> str | None:
        """
        Save HTML snapshot using Steel SDK scrape API.

        Args:
            session_id: Session identifier
            intent_id: Intent identifier (for filename)

        Returns:
            str | None: Path to saved HTML file, or None if save failed
        """
        if not self.config.save_html_snapshot:
            return None

        try:
            logger.debug(f"Extracting HTML for session {session_id}")

            # Get session URL
            session = self._steel_client.sessions.retrieve(session_id)
            current_url = getattr(session, "url", self.config.target_url)

            # Use Steel's scrape API to get HTML
            scrape_response = self._steel_client.scrape(
                url=current_url, format=["html"], session_id=session_id
            )

            # Extract HTML content
            html_content = getattr(scrape_response, "html", None)

            if not html_content:
                logger.warning("Scrape response missing HTML content")
                return None

            # Save HTML
            output_dir = Path(self.config.output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)

            html_path = output_dir / f"html_{intent_id}_{session_id}.html"
            html_path.write_text(str(html_content), encoding="utf-8")

            logger.info(f"Saved HTML snapshot: {html_path}")
            return str(html_path)

        except Exception as e:
            logger.warning(f"Failed to save HTML snapshot: {e}", exc_info=True)
            return None

    def _navigate_and_submit(self, session: dict, prompt: str) -> None:
        """
        Navigate to target site and submit prompt.

        This is a site-specific operation that must be implemented by subclasses.

        Args:
            session: Steel session data
            prompt: User intent prompt to submit

        Raises:
            NotImplementedError: Always (must be overridden)
        """
        raise NotImplementedError("Subclasses must implement _navigate_and_submit")

    def _extract_answer(self, session: dict) -> str:
        """
        Extract answer text from page.

        This is a site-specific operation that must be implemented by subclasses.

        Args:
            session: Steel session data

        Returns:
            str: Extracted answer text

        Raises:
            NotImplementedError: Always (must be overridden)
        """
        raise NotImplementedError("Subclasses must implement _extract_answer")

    def _estimate_cost(self, session: dict, start_time: float) -> float:
        """
        Estimate cost for Steel browser session.

        Args:
            session: Steel session data
            start_time: Session start timestamp

        Returns:
            float: Estimated cost in USD (0.0 for now, can be enhanced later)

        Note:
            Currently returns 0.0. Can be enhanced to calculate actual cost
            based on session duration and Steel pricing ($0.10-0.30/hour).
        """
        # Placeholder for cost tracking
        # Steel charges per hour ($0.10-0.30/hour based on plan)
        # Can calculate: (time.time() - start_time) / 3600 * hourly_rate
        return 0.0

    def _scrape_page_content(
        self, session_id: str, format: str = "markdown"
    ) -> str | None:
        """
        Scrape page content using Steel SDK scrape API.

        Args:
            session_id: Session identifier
            format: Output format ("markdown", "html", "cleaned_html", "readability")

        Returns:
            str | None: Scraped content, or None if scraping failed
        """
        try:
            logger.debug(f"Scraping page content for session {session_id} (format={format})")

            # Get session URL
            session = self._steel_client.sessions.retrieve(session_id)
            current_url = getattr(session, "url", self.config.target_url)

            # Use Steel's scrape API
            scrape_response = self._steel_client.scrape(
                url=current_url, format=[format], session_id=session_id
            )

            # Extract content based on format
            content = getattr(scrape_response, format, None)

            if not content:
                logger.warning(f"Scrape response missing {format} content")
                return None

            logger.info(f"Scraped {len(str(content))} chars in {format} format")
            return str(content)

        except Exception as e:
            logger.warning(f"Failed to scrape page content: {e}", exc_info=True)
            return None

    def __del__(self):
        """Cleanup: release any active sessions."""
        try:
            if self.session_id and self._current_session:
                logger.debug(f"Cleanup: Releasing session {self.session_id}")
                self._steel_client.sessions.release(self.session_id)
        except Exception:
            pass
