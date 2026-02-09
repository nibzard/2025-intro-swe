#!/usr/bin/env python3
"""
Fix Progressive Rock album covers with better URLs
"""
import sqlite3

def fix_covers():
    conn = sqlite3.connect('hiphop.db')
    cursor = conn.cursor()

    # Better cover URLs
    covers = {
        "The Dark Side of the Moon": "https://m.media-amazon.com/images/I/71fWylQK7fL._UF1000,1000_QL80_.jpg",
        "Close to the Edge": "https://m.media-amazon.com/images/I/81V6sDXGr4L._UF1000,1000_QL80_.jpg",
        "In the Court of the Crimson King": "https://m.media-amazon.com/images/I/71YkU8PpV8L._UF1000,1000_QL80_.jpg",
        "Selling England by the Pound": "https://m.media-amazon.com/images/I/819yfI0DKYL._UF1000,1000_QL80_.jpg",
        "2112": "https://m.media-amazon.com/images/I/71YAVYqBxWL._UF1000,1000_QL80_.jpg",
        "Fragile": "https://m.media-amazon.com/images/I/71nnzGBzlYL._UF1000,1000_QL80_.jpg",
        "The Wall": "https://m.media-amazon.com/images/I/71F5F5mfG0L._UF1000,1000_QL80_.jpg",
        "Red": "https://m.media-amazon.com/images/I/61m2U0pKbXL._UF1000,1000_QL80_.jpg",
        "A Farewell to Kings": "https://m.media-amazon.com/images/I/81tNH3yoavL._UF1000,1000_QL80_.jpg",
        "Thick as a Brick": "https://m.media-amazon.com/images/I/91vB9W9CzIL._UF1000,1000_QL80_.jpg",
        "Emerson, Lake & Palmer": "https://m.media-amazon.com/images/I/71Y9BT4gBmL._UF1000,1000_QL80_.jpg",
        "Wish You Were Here": "https://m.media-amazon.com/images/I/71NU89AlnPL._UF1000,1000_QL80_.jpg",
        "Foxtrot": "https://m.media-amazon.com/images/I/81VDqIWxvGL._UF1000,1000_QL80_.jpg",
        "Moving Pictures": "https://m.media-amazon.com/images/I/81SB7zcnxsL._UF1000,1000_QL80_.jpg",
        "Brain Salad Surgery": "https://m.media-amazon.com/images/I/71haBNaVgEL._UF1000,1000_QL80_.jpg"
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
    print(f"\n🎸 Fixed {len(covers)} prog rock album covers!")

if __name__ == "__main__":
    fix_covers()
