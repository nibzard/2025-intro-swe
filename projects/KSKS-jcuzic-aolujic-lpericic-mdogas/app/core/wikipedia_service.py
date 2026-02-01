import wikipedia
import logging
from typing import Optional, Dict
import re

logger = logging.getLogger(__name__)

class WikipediaService:
    """Service for fetching artist and album information from Wikipedia"""

    @staticmethod
    def _extract_comprehensive_bio(page, max_sentences: int = 15) -> Optional[str]:
        """
        Extract comprehensive biography from a Wikipedia page

        Args:
            page: Wikipedia page object
            max_sentences: Maximum number of sentences to return

        Returns:
            Comprehensive biography text
        """
        try:
            content = page.content
            bio_parts = []

            # 1. Get the intro paragraph (birth, overview)
            intro = page.summary.split('\n')[0]
            bio_parts.append(intro)

            # 2. Extract Early Life section
            early_life_match = re.search(
                r'==+\s*Early life\s*==+\s*(.*?)(?:\n==+|\Z)',
                content,
                re.DOTALL | re.IGNORECASE
            )

            if early_life_match:
                early_life = early_life_match.group(1).strip()
                early_life = re.sub(r'\n+', ' ', early_life)
                early_life = re.sub(r'\s+', ' ', early_life)
                sentences_list = re.split(r'(?<=[.!?])\s+', early_life)
                early_life_snippet = ' '.join(sentences_list[:4])
                if early_life_snippet:
                    bio_parts.append(early_life_snippet)

            # 3. Extract Career section (first part)
            career_match = re.search(
                r'==+\s*Career\s*==+\s*(.*?)(?:\n==+|\Z)',
                content,
                re.DOTALL | re.IGNORECASE
            )

            if career_match:
                career = career_match.group(1).strip()
                career = re.sub(r'\n+', ' ', career)
                career = re.sub(r'\s+', ' ', career)
                sentences_list = re.split(r'(?<=[.!?])\s+', career)
                career_snippet = ' '.join(sentences_list[:3])
                if career_snippet:
                    bio_parts.append(career_snippet)

            # 4. Extract Personal Life section
            personal_match = re.search(
                r'==+\s*Personal life\s*==+\s*(.*?)(?:\n==+|\Z)',
                content,
                re.DOTALL | re.IGNORECASE
            )

            if personal_match:
                personal = personal_match.group(1).strip()
                personal = re.sub(r'\n+', ' ', personal)
                personal = re.sub(r'\s+', ' ', personal)
                sentences_list = re.split(r'(?<=[.!?])\s+', personal)
                personal_snippet = ' '.join(sentences_list[:3])
                if personal_snippet:
                    bio_parts.append(personal_snippet)

            # 5. Extract Legacy/Influence section
            legacy_match = re.search(
                r'==+\s*(Legacy|Influence|Impact)\s*==+\s*(.*?)(?:\n==+|\Z)',
                content,
                re.DOTALL | re.IGNORECASE
            )

            if legacy_match:
                legacy = legacy_match.group(2).strip()
                legacy = re.sub(r'\n+', ' ', legacy)
                legacy = re.sub(r'\s+', ' ', legacy)
                sentences_list = re.split(r'(?<=[.!?])\s+', legacy)
                legacy_snippet = ' '.join(sentences_list[:2])
                if legacy_snippet:
                    bio_parts.append(legacy_snippet)

            # Combine all parts
            full_bio = ' '.join(bio_parts)

            # Clean up any Wikipedia markup that might remain
            full_bio = re.sub(r'\[\d+\]', '', full_bio)
            full_bio = re.sub(r'\s+', ' ', full_bio)

            # Limit to specified number of sentences
            sentences_list = re.split(r'(?<=[.!?])\s+', full_bio)
            limited_bio = ' '.join(sentences_list[:max_sentences])

            return limited_bio if limited_bio else None

        except Exception as e:
            logger.error(f"Error extracting bio: {str(e)}")
            return None

    @staticmethod
    def get_artist_bio(artist_name: str, genre: str = None, max_sentences: int = 15) -> Optional[str]:
        """
        Fetch comprehensive artist biography with personal and career information

        Args:
            artist_name: Name of the artist
            genre: Genre of the artist (hip_hop, prog_rock, etc.)
            max_sentences: Maximum number of sentences to return

        Returns:
            Detailed artist biography with personal info, career, and legacy
        """
        try:
            wikipedia.set_lang("en")

            # Determine search terms and validation keywords based on genre
            genre_suffix = None
            search_term = "musician"
            validation_terms = ['music', 'band', 'album', 'artist']

            if genre == 'hip_hop':
                genre_suffix = "(rapper)"
                search_term = "rapper"
                validation_terms = ['rapper', 'hip hop', 'hip-hop', 'mc ', 'emcee']
            elif genre == 'prog_rock':
                genre_suffix = "(band)"
                search_term = "band"
                validation_terms = ['progressive rock', 'prog rock', 'rock band', 'music', 'band']
            elif genre == 'classic_rock':
                genre_suffix = "(band)"
                search_term = "band rock"
                validation_terms = ['rock band', 'rock music', 'band', 'music', 'album']
            elif genre == 'jazz':
                genre_suffix = "(musician)"
                search_term = "jazz musician"
                validation_terms = ['jazz', 'musician', 'music', 'album', 'saxophone', 'trumpet', 'piano']

            # Try direct page fetch first with genre suffix (most accurate)
            if genre_suffix:
                try:
                    page = wikipedia.page(f"{artist_name} {genre_suffix}", auto_suggest=False)
                    return WikipediaService._extract_comprehensive_bio(page, max_sentences)
                except:
                    pass

            # If that fails, try without genre suffix
            try:
                page = wikipedia.page(artist_name, auto_suggest=False)
                content = page.content.lower()[:1500]
                # Verify it's a relevant artist page
                if any(term in content for term in validation_terms):
                    return WikipediaService._extract_comprehensive_bio(page, max_sentences)
            except:
                pass

            # Search for the artist as fallback
            search_results = wikipedia.search(f"{artist_name} {search_term}", results=5)

            if not search_results:
                logger.warning(f"No Wikipedia results found for artist: {artist_name}")
                return None

            # Try the first few search results
            for result in search_results:
                # Skip if result doesn't contain the artist name
                if artist_name.lower() not in result.lower():
                    continue
                try:
                    # Get the full page
                    page = wikipedia.page(result, auto_suggest=False)
                    content = page.content.lower()[:1500]

                    # Verify it's a relevant artist page
                    if not any(term in content for term in validation_terms):
                        continue

                    # Extract and return comprehensive bio
                    bio = WikipediaService._extract_comprehensive_bio(page, max_sentences)
                    if bio:
                        return bio

                except wikipedia.exceptions.DisambiguationError as e:
                    # Try first disambig option
                    if e.options:
                        try:
                            page = wikipedia.page(e.options[0], auto_suggest=False)
                            bio = WikipediaService._extract_comprehensive_bio(page, max_sentences)
                            if bio:
                                return bio
                        except Exception:
                            continue
                except wikipedia.exceptions.PageError:
                    continue
                except Exception as e:
                    logger.error(f"Error fetching page for {result}: {str(e)}")
                    continue

            logger.warning(f"Could not find relevant Wikipedia page for artist: {artist_name}")
            return None

        except Exception as e:
            logger.error(f"Error fetching artist bio for {artist_name}: {str(e)}")
            return None

    @staticmethod
    def get_album_story(album_title: str, artist_name: str, sentences: int = 4) -> Optional[str]:
        """
        Fetch album backstory/history from Wikipedia

        Args:
            album_title: Title of the album
            artist_name: Name of the artist
            sentences: Number of sentences to return

        Returns:
            Album backstory text or None if not found
        """
        try:
            wikipedia.set_lang("en")
            # Search for the album
            search_query = f"{album_title} {artist_name} album"
            search_results = wikipedia.search(search_query, results=3)

            if not search_results:
                logger.warning(f"No Wikipedia results found for album: {album_title} by {artist_name}")
                return None

            # Try the first few search results
            for result in search_results:
                try:
                    summary = wikipedia.summary(result, sentences=sentences, auto_suggest=False)
                    # Verify it's likely the right album
                    if album_title.lower() in summary.lower() or artist_name.lower() in summary.lower():
                        return summary
                except wikipedia.exceptions.DisambiguationError as e:
                    # Try to find the album in disambiguation options
                    for option in e.options:
                        if 'album' in option.lower():
                            try:
                                summary = wikipedia.summary(option, sentences=sentences, auto_suggest=False)
                                return summary
                            except:
                                continue
                except wikipedia.exceptions.PageError:
                    continue
                except Exception as e:
                    logger.error(f"Error fetching Wikipedia page for {result}: {str(e)}")
                    continue

            logger.warning(f"Could not find relevant Wikipedia page for album: {album_title}")
            return None

        except Exception as e:
            logger.error(f"Error fetching album story for {album_title}: {str(e)}")
            return None

    @staticmethod
    def get_producer_bio(producer_name: str, sentences: int = 4) -> Optional[str]:
        """
        Fetch producer biography from Wikipedia

        Args:
            producer_name: Name of the producer
            sentences: Number of sentences to return

        Returns:
            Producer biography text or None if not found
        """
        try:
            wikipedia.set_lang("en")
            # Search for the producer
            search_results = wikipedia.search(f"{producer_name} producer hip hop", results=3)

            if not search_results:
                logger.warning(f"No Wikipedia results found for producer: {producer_name}")
                return None

            # Try the first few search results
            for result in search_results:
                try:
                    summary = wikipedia.summary(result, sentences=sentences, auto_suggest=False)
                    # Verify it's likely the right producer
                    if any(term in summary.lower() for term in ['producer', 'production', 'hip hop', 'hip-hop', 'music']):
                        return summary
                except wikipedia.exceptions.DisambiguationError as e:
                    if e.options:
                        try:
                            summary = wikipedia.summary(e.options[0], sentences=sentences, auto_suggest=False)
                            return summary
                        except:
                            continue
                except wikipedia.exceptions.PageError:
                    continue
                except Exception as e:
                    logger.error(f"Error fetching Wikipedia page for {result}: {str(e)}")
                    continue

            logger.warning(f"Could not find relevant Wikipedia page for producer: {producer_name}")
            return None

        except Exception as e:
            logger.error(f"Error fetching producer bio for {producer_name}: {str(e)}")
            return None

    @staticmethod
    def enrich_album_data(album_title: str, artist_name: str, genre: str = None, producer_name: Optional[str] = None) -> Dict[str, Optional[str]]:
        """
        Fetch all Wikipedia data for an album at once

        Args:
            album_title: Title of the album
            artist_name: Name of the artist
            genre: Genre of the album (hip_hop, prog_rock, etc.)
            producer_name: Name of the producer (optional)

        Returns:
            Dictionary with artist_bio, album_story, and producer_bio
        """
        result = {
            "artist_bio": WikipediaService.get_artist_bio(artist_name, genre),
            "album_story": WikipediaService.get_album_story(album_title, artist_name),
            "producer_bio": None
        }

        # Only fetch producer bio if producer is different from artist
        # Check if producer name is in the artist name or vice versa
        if producer_name:
            producer_lower = producer_name.lower()
            artist_lower = artist_name.lower()

            # Skip if they're the same person (like "Dr. Dre" as both artist and producer)
            if artist_lower not in producer_lower and producer_lower not in artist_lower:
                # Also skip if producer has multiple names (likely multiple producers)
                if ',' not in producer_name and '&' not in producer_name and 'and' not in producer_name.lower():
                    result["producer_bio"] = WikipediaService.get_producer_bio(producer_name)

        return result
