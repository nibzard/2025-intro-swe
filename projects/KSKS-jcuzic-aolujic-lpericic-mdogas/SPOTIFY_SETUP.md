# Spotify API Setup Guide

This guide will help you set up Spotify API integration to automatically fetch album data.

## Step 1: Get Spotify API Credentials

1. **Go to Spotify Developer Dashboard**
   - Open your browser and go to: https://developer.spotify.com/dashboard
   - Log in with your Spotify account (the one you just created)

2. **Create a New App**
   - Click the green **"Create app"** button
   - Fill in the form:
     - **App name**: `Music Database` (or any name you like)
     - **App description**: `Personal music collection API`
     - **Redirect URI**: `http://localhost:3000`
     - **Which API/SDKs are you planning to use?**: Check **"Web API"**
   - Agree to the terms and click **"Save"**

3. **Get Your Credentials**
   - You'll see your new app in the dashboard
   - Click on the app name to open it
   - Click the **"Settings"** button (top right)
   - You'll see two important values:
     - **Client ID**: A long string of letters and numbers (visible)
     - **Client Secret**: Click **"View client secret"** to see it

4. **Copy Your Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret**

## Step 2: Update Your .env File

Open the `.env` file in your project and replace the placeholder values:

```bash
SPOTIFY_CLIENT_ID=your-actual-client-id-here
SPOTIFY_CLIENT_SECRET=your-actual-client-secret-here
```

**Example:**
```bash
SPOTIFY_CLIENT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
SPOTIFY_CLIENT_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

## Step 3: Install Dependencies

```bash
pip install spotipy==2.23.0
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

## Step 4: Fetch Albums from Spotify

### Option A: Fetch Predefined Albums (Automatic)

Run the seed script to automatically fetch albums from Spotify:

```bash
python seed_from_spotify.py
```

This will fetch:
- Hip hop classics (Nas, Dr. Dre, Biggie, Wu-Tang, 2Pac, etc.)
- Jazz albums (Miles Davis, John Coltrane, etc.)
- Classic rock (Pink Floyd, Led Zeppelin, Beatles, etc.)
- Progressive rock (Yes, King Crimson, etc.)

### Option B: Fetch All Albums by a Specific Artist

To fetch all albums by a specific artist:

```bash
python seed_from_spotify.py --artist "Nas" --genre hip_hop --region east_coast
```

Examples:
```bash
# Fetch Nas discography
python seed_from_spotify.py --artist "Nas" --genre hip_hop --region east_coast

# Fetch Miles Davis albums
python seed_from_spotify.py --artist "Miles Davis" --genre jazz --region east_coast

# Fetch Pink Floyd albums
python seed_from_spotify.py --artist "Pink Floyd" --genre prog_rock --region uk
```

## Step 5: Start Your API

```bash
uvicorn app.main:app --reload
```

Open your browser to: http://localhost:8000

The albums will be automatically available in your API!

## What Gets Fetched Automatically?

The script fetches from Spotify:
- ✅ Album title
- ✅ Artist name
- ✅ Release year
- ✅ Album cover image URL (high quality)
- ✅ Record label
- ✅ Popularity score
- ✅ Number of tracks
- ✅ Spotify URL

All this data is automatically saved to your database!

## Troubleshooting

### Error: "No credentials found"
- Make sure you've updated your `.env` file with real credentials
- Make sure there are no extra spaces in the `.env` file
- Make sure the `.env` file is in the root directory of your project

### Error: "Album not found"
- The album name might be slightly different on Spotify
- Try searching on Spotify.com first to see the exact album name
- You can manually edit the album name in the `seed_from_spotify.py` file

### Error: "spotipy module not found"
- Run: `pip install spotipy`

## Adding More Albums

To add more albums, edit the `ALBUMS_TO_FETCH` list in `seed_from_spotify.py`:

```python
ALBUMS_TO_FETCH = [
    ("Album Name", "Artist Name", "genre", "region"),
    ("Illmatic", "Nas", "hip_hop", "east_coast"),
    # Add more albums here...
]
```

Then run the script again:
```bash
python seed_from_spotify.py
```

## Need Help?

If you have any issues:
1. Check that your Spotify credentials are correct in `.env`
2. Make sure you've installed spotipy: `pip install spotipy`
3. Try running `python spotify_example.py` to test your credentials
