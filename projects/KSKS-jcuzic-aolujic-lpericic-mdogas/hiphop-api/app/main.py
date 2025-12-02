from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import auth, albums, ratings, recommendations, artists, producers

# Kreiraj tablice u bazi
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Old School Hip Hop API",
    description="API za preporuke i upravljanje klasičnom hip hop glazbom",
    version="1.0.0"
)

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

@app.get("/")
def root():
    return {
        "message": "Welcome to Old School Hip Hop API 🎤",
        "docs": "/docs",
        "version": "1.0.0"
    }
