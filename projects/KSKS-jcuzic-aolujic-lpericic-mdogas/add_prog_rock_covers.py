#!/usr/bin/env python3
"""
Add cover URLs to Progressive Rock albums
"""
import sqlite3

def add_covers():
    conn = sqlite3.connect('hiphop.db')
    cursor = conn.cursor()

    # Prog rock album covers from reliable sources
    covers = {
        "The Dark Side of the Moon": "https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png",
        "Close to the Edge": "https://upload.wikimedia.org/wikipedia/en/9/94/Yes_Close_to_the_Edge.jpg",
        "In the Court of the Crimson King": "https://upload.wikimedia.org/wikipedia/en/8/84/In_the_Court_of_the_Crimson_King_-_40th_Anniversary_Box_Set_-_Front_cover.jpeg",
        "Selling England by the Pound": "https://upload.wikimedia.org/wikipedia/en/4/42/Genesis_-_Selling_England_by_the_Pound.jpg",
        "2112": "https://upload.wikimedia.org/wikipedia/en/9/97/Rush_2112_cover.jpg",
        "Fragile": "https://upload.wikimedia.org/wikipedia/en/2/24/Yes_-_Fragile.svg",
        "The Wall": "https://upload.wikimedia.org/wikipedia/en/1/13/PinkFloydWallCoverOriginalNoText.jpg",
        "Red": "https://upload.wikimedia.org/wikipedia/en/4/4a/KingCrimson-Red.jpg",
        "A Farewell to Kings": "https://upload.wikimedia.org/wikipedia/en/e/ec/Rush_A_Farewell_to_Kings.jpg",
        "Thick as a Brick": "https://upload.wikimedia.org/wikipedia/en/6/6d/JethroTull-albums-thickasabrick.jpg",
        "Emerson, Lake & Palmer": "https://upload.wikimedia.org/wikipedia/en/3/3b/Emerson-Lake-And-Palmer-First-Album.jpg",
        "Wish You Were Here": "https://upload.wikimedia.org/wikipedia/en/a/a4/Pink_Floyd%2C_Wish_You_Were_Here_%281975%29.png",
        "Foxtrot": "https://upload.wikimedia.org/wikipedia/en/c/c4/Genesis_Foxtrot.jpg",
        "Moving Pictures": "https://upload.wikimedia.org/wikipedia/en/2/22/Rush_Moving_Pictures.jpg",
        "Brain Salad Surgery": "https://upload.wikimedia.org/wikipedia/en/f/f8/Brain_Salad_Surgery_%28Front_Cover%29.jpg"
    }

    for title, url in covers.items():
        try:
            cursor.execute(
                "UPDATE albums SET cover_url = ? WHERE title = ?",
                (url, title)
            )
            print(f"✅ Updated cover for: {title}")
        except Exception as e:
            print(f"❌ Error updating {title}: {e}")

    conn.commit()
    conn.close()
    print(f"\n🎸 Updated {len(covers)} prog rock album covers!")

if __name__ == "__main__":
    add_covers()
