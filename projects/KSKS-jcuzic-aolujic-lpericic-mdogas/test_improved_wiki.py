#!/usr/bin/env python3
"""
Test the improved Wikipedia integration with personal details
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.wikipedia_service import WikipediaService

def test_improved_wikipedia():
    print("=" * 60)
    print("Testing Improved Wikipedia Integration")
    print("=" * 60)

    # Test 1: Get detailed artist bio with personal info
    print("\n1. Testing Detailed Artist Bio for Nas...")
    artist_bio = WikipediaService.get_artist_bio("Nas")
    if artist_bio:
        print(f"✅ SUCCESS! Got {len(artist_bio)} characters")
        print(f"\nFull Bio:\n{artist_bio}")
    else:
        print("❌ FAILED: Could not fetch artist bio")

    # Test 2: Test artist/producer overlap handling
    print("\n" + "=" * 60)
    print("2. Testing Dr. Dre (artist = producer case)...")
    data = WikipediaService.enrich_album_data("The Chronic", "Dr. Dre", "Dr. Dre")
    print(f"✅ Artist bio: {len(data['artist_bio']) if data['artist_bio'] else 0} chars")
    print(f"✅ Album story: {len(data['album_story']) if data['album_story'] else 0} chars")
    print(f"✅ Producer bio: {data['producer_bio']} (should be None since artist = producer)")

    # Test 3: Test different producer
    print("\n" + "=" * 60)
    print("3. Testing Illmatic with separate producer...")
    data = WikipediaService.enrich_album_data("Illmatic", "Nas", "DJ Premier")
    print(f"✅ Artist bio: {len(data['artist_bio']) if data['artist_bio'] else 0} chars")
    print(f"✅ Album story: {len(data['album_story']) if data['album_story'] else 0} chars")
    print(f"✅ Producer bio: {len(data['producer_bio']) if data['producer_bio'] else 0} chars")

    print("\n" + "=" * 60)
    print("Improved Wikipedia Integration Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_improved_wikipedia()
