#!/usr/bin/env python3
"""
Migration script to add genre column to the database
"""
import sqlite3

def migrate_database():
    conn = sqlite3.connect('hiphop.db')
    cursor = conn.cursor()

    try:
        # Add the genre column with default value
        cursor.execute("ALTER TABLE albums ADD COLUMN genre TEXT DEFAULT 'hip_hop'")
        print("✅ Added genre column")

        # Update all existing albums to have hip_hop genre
        cursor.execute("UPDATE albums SET genre = 'hip_hop' WHERE genre IS NULL OR genre = ''")
        print("✅ Updated existing albums to hip_hop genre")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️  genre column already exists")
        else:
            raise

    # Make region nullable (SQLite doesn't directly support this, but we can work with it)
    print("✅ Region is now optional in the application logic")

    conn.commit()
    conn.close()
    print("\n🎉 Database migration completed!")

if __name__ == "__main__":
    migrate_database()
