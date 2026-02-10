#!/usr/bin/env python3
"""
Quick test script for Wikipedia integration
"""
from app.core.wikipedia_service import WikipediaService
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def test_wikipedia():
    print("=" * 60)
    print("Testing Wikipedia Integration")
    print("=" * 60)

    # Test 1: Get artist bio
    print("\n1. Testing Artist Bio for Nas...")
    artist_bio = WikipediaService.get_artist_bio("Nas", sentences=3)
    if artist_bio:
        print(f"✅ SUCCESS! Got {len(artist_bio)} characters")
        print(f"Preview: {artist_bio[:150]}...")
    else:
        print("❌ FAILED: Could not fetch artist bio")

    # Test 2: Get album story
    print("\n2. Testing Album Story for Illmatic...")
    album_story = WikipediaService.get_album_story(
        "Illmatic", "Nas", sentences=3)
    if album_story:
        print(f"✅ SUCCESS! Got {len(album_story)} characters")
        print(f"Preview: {album_story[:150]}...")
    else:
        print("❌ FAILED: Could not fetch album story")

    # Test 3: Get producer bio
    print("\n3. Testing Producer Bio for DJ Premier...")
    producer_bio = WikipediaService.get_producer_bio("DJ Premier", sentences=2)
    if producer_bio:
        print(f"✅ SUCCESS! Got {len(producer_bio)} characters")
        print(f"Preview: {producer_bio[:150]}...")
    else:
        print("❌ FAILED: Could not fetch producer bio")

    # Test 4: Enrich full album data
    print("\n4. Testing Full Album Enrichment...")
    data = WikipediaService.enrich_album_data(
        "Ready to Die", "The Notorious B.I.G.", "Easy Mo Bee")
    success_count = sum(1 for v in data.values() if v is not None)
    print(f"✅ Fetched {success_count}/3 Wikipedia entries")

    if data['artist_bio']:
        print(f"   - Artist bio: {len(data['artist_bio'])} chars")
    if data['album_story']:
        print(f"   - Album story: {len(data['album_story'])} chars")
    if data['producer_bio']:
        print(f"   - Producer bio: {len(data['producer_bio'])} chars")

    print("\n" + "=" * 60)

    print("Wikipedia Integration Test Complete!")
    print("=" * 60)


if __name__ == "__main__":
    test_wikipedia()
