# Wikipedia Integration Feature

This feature automatically fetches artist biographies, album backstories, and producer information from Wikipedia to enrich the Hip Hop album database.

## What's New

### Backend Changes

1. **New Database Fields** (`app/models/album.py`)
   - `artist_bio` - Artist biography from Wikipedia
   - `album_story` - Album creation backstory and history
   - `producer_bio` - Producer biography and career info

2. **Wikipedia Service** (`app/core/wikipedia_service.py`)
   - `get_artist_bio(artist_name)` - Fetches artist biography
   - `get_album_story(album_title, artist_name)` - Fetches album history
   - `get_producer_bio(producer_name)` - Fetches producer info
   - `enrich_album_data()` - Fetches all Wikipedia data at once

3. **New API Endpoints** (`app/api/albums.py`)
   - `POST /api/v1/albums/{album_id}/enrich-wikipedia` - Fetch Wikipedia data for one album
   - `POST /api/v1/albums/bulk-enrich-wikipedia` - Enrich multiple albums in background

### Frontend Changes

1. **Enhanced Album Details Modal**
   - Displays artist biography with artist emoji 🎤
   - Shows album backstory with album emoji 💿
   - Displays producer bio with keyboard emoji 🎹
   - Beautiful styled sections with orange highlight borders

2. **Fetch Wikipedia Button**
   - Appears when Wikipedia data is not available
   - One-click fetching with loading state
   - Automatically refreshes to show new data

## Installation

```bash
# Install new dependencies
pip install wikipedia==1.4.0 httpx==0.25.2

# Or install from requirements.txt
pip install -r requirements.txt
```

## Usage

### Option 1: Fetch Data for Individual Albums (Frontend)

1. Open an album detail page
2. Click the "📚 Fetch Wikipedia Info" button
3. Wait a few seconds for Wikipedia to fetch data
4. The page will refresh with artist bio, album story, and producer info

### Option 2: Fetch Data via API

```bash
# Enrich a single album (album_id = 1)
curl -X POST http://localhost:8000/api/v1/albums/1/enrich-wikipedia

# Bulk enrich all albums (runs in background)
curl -X POST http://localhost:8000/api/v1/albums/bulk-enrich-wikipedia
```

### Option 3: Use Python Script

```python
from app.core.wikipedia_service import WikipediaService

# Get artist bio
bio = WikipediaService.get_artist_bio("Nas")
print(bio)

# Get album story
story = WikipediaService.get_album_story("Illmatic", "Nas")
print(story)

# Get all data at once
data = WikipediaService.enrich_album_data("Illmatic", "Nas", "DJ Premier")
print(data['artist_bio'])
print(data['album_story'])
print(data['producer_bio'])
```

## Testing

Run the test script to verify Wikipedia integration:

```bash
python test_wikipedia.py
```

Expected output:
- ✅ Artist bio fetched successfully
- ✅ Album story fetched successfully
- ✅ Producer bio fetched successfully
- ✅ Full enrichment successful

## How It Works

1. **Wikipedia API** - Uses the official Wikipedia Python library (not web scraping)
2. **Smart Search** - Searches for relevant articles using artist/album names + context keywords
3. **Validation** - Verifies results contain hip-hop related terms
4. **Disambiguation Handling** - Automatically handles Wikipedia disambiguation pages
5. **Error Handling** - Gracefully handles missing data without breaking

## Data Storage

- Wikipedia data is stored in the database for fast access
- Data persists across server restarts
- Can be updated anytime by calling the enrich endpoints again
- Old data is overwritten with new fetches

## UI Display

The Wikipedia data appears in the album details modal with:
- Styled colored sections with left border accent
- Section headers with emojis for visual appeal
- Readable justified text formatting
- Responsive design for mobile and desktop

## Benefits

1. **Educational Value** - Users learn about artists and albums
2. **Engagement** - More content keeps users browsing longer
3. **Context** - Historical background enriches the listening experience
4. **Discovery** - Learn about producers and collaborations
5. **Automatic** - No manual data entry required

## Limitations

- Requires internet connection to fetch Wikipedia data
- Some lesser-known artists/albums may not have Wikipedia pages
- Wikipedia API rate limits may apply for bulk operations
- Data quality depends on Wikipedia article quality

## Future Enhancements

Potential improvements:
- Cache Wikipedia data to reduce API calls
- Add refresh button to update stale data
- Show Wikipedia source attribution/links
- Add support for multiple languages
- Fetch discography information
- Add related artists section

## Troubleshooting

**Problem**: "Could not fetch Wikipedia data"
- **Solution**: Artist/album name might not match Wikipedia article titles exactly. Try alternative spellings or check if Wikipedia page exists.

**Problem**: Wrong artist/album information displayed
- **Solution**: The search algorithm looks for hip-hop related terms. Some common names might match wrong pages. This can be improved by making search terms more specific.

**Problem**: Slow fetching
- **Solution**: Wikipedia API can be slow. Consider using the bulk enrich endpoint to process multiple albums in the background.

## API Response Example

```json
{
  "id": 1,
  "title": "Illmatic",
  "artist": "Nas",
  "year": 1994,
  "region": "east_coast",
  "artist_bio": "Nasir bin Olu Dara Jones, known professionally as Nas, is an American rapper...",
  "album_story": "Illmatic is the debut studio album by American rapper Nas, released on April 19, 1994...",
  "producer_bio": "Christopher Edward Martin, known professionally as DJ Premier, is an American record producer..."
}
```

## Credits

- Wikipedia API: https://github.com/goldsmith/Wikipedia
- FastAPI: https://fastapi.tiangolo.com/
- Hip Hop album data curated for educational purposes
