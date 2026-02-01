from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import auth, albums, ratings, recommendations, artists, producers
from app.api import comments
from app.api import users
from app.core.auto_seed import auto_fetch_albums
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Kreiraj tablice u bazi
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Old School Hip Hop API",
    description="API za preporuke i upravljanje klasičnom hip hop glazbom",
    version="1.0.0"
)


@app.on_event("startup")
async def startup_event():
    """
    Automatically fetch albums from Spotify when the server starts
    """
    logger.info("🚀 Starting up the API...")
    logger.info("🎵 Checking if we need to fetch albums from Spotify...")

    try:
        auto_fetch_albums()
        logger.info("✅ Startup complete!")
    except Exception as e:
        logger.error(f"⚠️  Error during auto-fetch: {e}")
        logger.info("⚠️  Continuing without auto-fetch...")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registriraj routere
app.include_router(auth.router, prefix="/api/v1")
app.include_router(albums.router, prefix="/api/v1")
app.include_router(ratings.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(artists.router, prefix="/api/v1")
app.include_router(producers.router, prefix="/api/v1")
app.include_router(comments.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Welcome to Old School Hip Hop API 🎤",
        "docs": "/docs",
        "version": "1.0.0"
    }
