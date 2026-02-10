#!/usr/bin/env python3
"""
Migration script to add Wikipedia columns to the database
"""
import sqlite3

def migrate_database():
    conn = sqlite3.connect('hiphop.db')
    cursor = conn.cursor()

    try:
        # Add the new columns
        cursor.execute("ALTER TABLE albums ADD COLUMN artist_bio TEXT")
        print("✅ Added artist_bio column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️  artist_bio column already exists")
        else:
            raise

    try:
        cursor.execute("ALTER TABLE albums ADD COLUMN album_story TEXT")
        print("✅ Added album_story column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️  album_story column already exists")
        else:
            raise

    try:
        cursor.execute("ALTER TABLE albums ADD COLUMN producer_bio TEXT")
        print("✅ Added producer_bio column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️  producer_bio column already exists")
        else:
            raise

    conn.commit()
    conn.close()
    print("\n🎉 Database migration completed!")

if __name__ == "__main__":
    migrate_database()
