# Automatic Spotify Data Fetching - Setup Complete!

## What's Been Set Up

Your website now **automatically fetches albums from Spotify** when you open it! Here's what happens:

### 1. **Automatic Fetching on Startup**
Every time you start your API server:
- The system checks if your database has albums
- If it has fewer than 10 albums, it automatically fetches from Spotify
- It fetches albums from **4 genres**:
  - **Hip Hop** (15 albums: Nas, Dr. Dre, Biggie, Wu-Tang, 2Pac, Kendrick, etc.)
  - **Jazz** (10 albums: Miles Davis, Coltrane, etc.)
  - **Classic Rock** (10 albums: Pink Floyd, Led Zeppelin, Beatles, etc.)
  - **Progressive Rock** (10 albums: Yes, King Crimson, etc.)

### 2. **What Gets Fetched Automatically**
Each album includes:
- Album title
- Artist name
- Release year
- **High-quality album cover image URL**
- Record label
- Spotify popularity score
- Number of tracks
- Genre and region

### 3. **No Manual Commands Needed!**
Just:
1. Start your server: `uvicorn app.main:app --reload`
2. Open your website
3. The data is already there!

---

## How to Use It

### View Your Albums
Open your browser to:
- **http://localhost:8000** - API home
- **http://localhost:8000/docs** - Interactive API documentation
- **http://localhost:8000/api/v1/albums/** - See all albums with covers

### Fetch More Albums from Your Website

#### Option 1: Check Available Genres
```
GET http://localhost:8000/api/v1/albums/available-genres
```

This shows you what genres are available to fetch.

#### Option 2: Fetch Albums for a Specific Genre
```
POST http://localhost:8000/api/v1/albums/fetch-from-spotify?genre=hip_hop&limit=5
```

Examples:
- Fetch 5 hip hop albums: `?genre=hip_hop&limit=5`
- Fetch 10 jazz albums: `?genre=jazz&limit=10`
- Fetch 3 rock albums: `?genre=classic_rock&limit=3`

#### Option 3: Fetch Albums from All Genres
```
POST http://localhost:8000/api/v1/albums/fetch-from-spotify?limit=3
```

This fetches 3 albums from each genre automatically!

---

## How It Works

### When You Start the Server:
```
🚀 Starting up the API...
🎵 Checking if we need to fetch albums from Spotify...
🎵 Current database has 57 albums
✅ Database already populated, skipping auto-fetch
✅ Startup complete!
```

### If Database Needs More Albums:
```
🚀 Starting up the API...
🎵 Checking if we need to fetch albums from Spotify...
📥 Auto-fetching albums from Spotify...
🔍 Attempting to fetch 45 albums...
✅ Added: Nas - Illmatic
✅ Added: Dr. Dre - The Chronic
...
🎉 Auto-fetch complete! Added 20 new albums
```

---

## Files Created

1. **`app/core/auto_seed.py`**
   - Contains the automatic fetching logic
   - Defines which albums to fetch for each genre

2. **`app/core/spotify_service.py`**
   - Spotify API integration
   - Methods to search and fetch album data

3. **Updated: `app/main.py`**
   - Added startup event handler
   - Automatically runs auto-fetch on server start

4. **Updated: `app/api/albums.py`**
   - Added `/available-genres` endpoint
   - Added `/fetch-from-spotify` endpoint

---

## Frontend Integration

Your frontend can now make API calls to fetch and display albums:

```javascript
// Fetch all albums
fetch('http://localhost:8000/api/v1/albums/')
  .then(res => res.json())
  .then(albums => {
    albums.forEach(album => {
      console.log(album.title, album.cover_url);
      // Display album cover: <img src={album.cover_url} />
    });
  });

// Fetch more albums automatically
fetch('http://localhost:8000/api/v1/albums/fetch-from-spotify?genre=hip_hop&limit=5', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => {
    console.log(data.message);
    // Refresh album list
  });
```

---

## Adding More Albums

### Method 1: Add to the Auto-Fetch List
Edit `app/core/auto_seed.py` and add albums to the `AUTO_FETCH_ALBUMS` dictionary:

```python
"hip_hop": [
    ("Illmatic", "Nas", "east_coast"),
    ("Your New Album", "Artist Name", "region"),
    # Add more here...
],
```

### Method 2: Use the Fetch Endpoint
Call the endpoint from your website or use curl:

```bash
curl -X POST "http://localhost:8000/api/v1/albums/fetch-from-spotify?genre=hip_hop&limit=10"
```

### Method 3: Use the Python Script
```bash
python seed_from_spotify.py --artist "Kendrick Lamar" --genre hip_hop --region west_coast
```

---

## Summary

**You're all set!** Your website now:
- Automatically fetches albums from Spotify when it starts
- Has 57+ albums already loaded with cover art
- Can fetch more albums on-demand via API endpoints
- Works seamlessly with your frontend

Just open your browser to **http://localhost:8000** and everything will be there automatically!

No manual commands needed - it's completely automatic!

