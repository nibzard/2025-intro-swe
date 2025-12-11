from sqlalchemy.orm import Session
from app.models.album import Album
from typing import List, Dict
import random

class RecommendationEngine:
    
    @staticmethod
    def get_similar_albums(db: Session, album_id: int, limit: int = 5) -> List[Dict]:
        """
        Preporuči slične albume na temelju:
        - Isti region (East Coast, West Coast, South)
        - Slična godina (±3 godine)
        - Visok rating
        """
        # Dohvati izvorni album
        source_album = db.query(Album).filter(Album.id == album_id).first()
        if not source_album:
            return []
        
        recommendations = []
        
        # 1. Albumi iz istog regiona (najviši prioritet)
        same_region = db.query(Album).filter(
            Album.region == source_album.region,
            Album.id != album_id
        ).order_by(Album.avg_rating.desc()).limit(3).all()
        
        for album in same_region:
            recommendations.append({
                "album": album,
                "similarity_score": 0.9,
                "reason": f"Isti region ({source_album.region.replace('_', ' ').title()}) - sličan stil proizvodnje"
            })
        
        # 2. Albumi iz slične ere (±3 godine)
        year_min = source_album.year - 3
        year_max = source_album.year + 3
        
        similar_era = db.query(Album).filter(
            Album.year >= year_min,
            Album.year <= year_max,
            Album.id != album_id,
            Album.region != source_album.region  # Različit region za raznolikost
        ).order_by(Album.avg_rating.desc()).limit(2).all()
        
        for album in similar_era:
            recommendations.append({
                "album": album,
                "similarity_score": 0.75,
                "reason": f"Ista era ({album.year}) - slična glazbena klima"
            })
        
        # Ukloni duplikate (ako ih ima)
        seen_ids = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec["album"].id not in seen_ids:
                seen_ids.add(rec["album"].id)
                unique_recommendations.append(rec)
        
        # Ograniči na traženi limit
        return unique_recommendations[:limit]
    
    @staticmethod
    def get_top_rated(db: Session, limit: int = 10, region: str = None) -> List[Album]:
        """Dohvati najbolje ocijenjene albume"""
        query = db.query(Album).filter(Album.total_ratings > 0)
        
        if region:
            query = query.filter(Album.region == region)
        
        return query.order_by(Album.avg_rating.desc()).limit(limit).all()
    
    @staticmethod
    def get_random_classic(db: Session, region: str = None, era: str = None) -> Album:
        """
        Nasumični klasični album za otkrivanje
        Era: 'golden_age' (1988-1997), 'late_90s' (1998-2000)
        """
        query = db.query(Album)
        
        if region:
            query = query.filter(Album.region == region)
        
        if era == "golden_age":
            query = query.filter(Album.year >= 1988, Album.year <= 1997)
        elif era == "late_90s":
            query = query.filter(Album.year >= 1998, Album.year <= 2000)
        
        albums = query.all()
        
        if not albums:
            return None
        
        return random.choice(albums)
    
    @staticmethod
    def get_artist_discography(db: Session, artist: str) -> List[Album]:
        """Dohvati sve albume od istog izvođača"""
        return db.query(Album).filter(
            Album.artist.ilike(f"%{artist}%")
        ).order_by(Album.year).all()
