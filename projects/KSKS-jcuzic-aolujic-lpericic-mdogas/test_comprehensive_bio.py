#!/usr/bin/env python3
"""
Test the comprehensive artist biography with personal details
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.wikipedia_service import WikipediaService

def test_comprehensive_bio():
    print("=" * 80)
    print("Testing Comprehensive Artist Biography")
    print("=" * 80)

    # Test with Nas
    print("\n🎤 Testing Nas Biography...")
    print("-" * 80)
    artist_bio = WikipediaService.get_artist_bio("Nas")
    if artist_bio:
        print(f"✅ SUCCESS! Got {len(artist_bio)} characters")
        print(f"\n{artist_bio}\n")
    else:
        print("❌ FAILED: Could not fetch artist bio")

    print("=" * 80)
    print("\n🎤 Testing The Notorious B.I.G. Biography...")
    print("-" * 80)
    biggie_bio = WikipediaService.get_artist_bio("The Notorious B.I.G.")
    if biggie_bio:
        print(f"✅ SUCCESS! Got {len(biggie_bio)} characters")
        print(f"\n{biggie_bio}\n")
    else:
        print("❌ FAILED: Could not fetch artist bio")

    print("=" * 80)
    print("\n🎤 Testing 2Pac Biography...")
    print("-" * 80)
    tupac_bio = WikipediaService.get_artist_bio("2Pac")
    if tupac_bio:
        print(f"✅ SUCCESS! Got {len(tupac_bio)} characters")
        print(f"\n{tupac_bio}\n")
    else:
        print("❌ FAILED: Could not fetch artist bio")

    print("=" * 80)
    print("✅ Comprehensive Biography Test Complete!")
    print("=" * 80)

if __name__ == "__main__":
    test_comprehensive_bio()
