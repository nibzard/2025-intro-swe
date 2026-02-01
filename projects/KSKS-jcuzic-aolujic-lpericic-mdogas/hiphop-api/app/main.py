from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.database import engine, Base
from app.api import auth, albums, ratings, recommendations, comments
from app.core.auto_seed import auto_fetch_albums
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Kreiraj tablice u bazi
Base.metadata.create_all(bind=engine)


# Middleware to force HTTPS in redirects
class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # If it's a redirect response, ensure the Location header uses HTTPS
        if response.status_code in (301, 302, 303, 307, 308):
            location = response.headers.get("location")
            if location and location.startswith("http://"):
                # Replace http:// with https://
                response.headers["location"] = location.replace("http://", "https://", 1)
                logger.info(f"Fixed redirect: {location} -> {response.headers['location']}")

        return response

app = FastAPI(
    title="Old School Hip Hop API",
    description="API za preporuke i upravljanje klasičnom hip hop glazbom",
    version="1.0.0",
    root_path="",
    redirect_slashes=False
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

# Add HTTPS redirect middleware FIRST
app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trust Railway proxy headers
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

# Registriraj routere
app.include_router(auth.router, prefix="/api/v1")
app.include_router(albums.router, prefix="/api/v1")
app.include_router(ratings.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(comments.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Welcome to Old School Hip Hop API 🎤",
        "docs": "/docs",
        "version": "1.0.0"
    }
