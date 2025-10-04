import sqlite3
import json
import os
from datetime import datetime

class Database:
    def __init__(self, db_path='/app/db/life_stats.db'):
        # Ensure directory exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                location TEXT,
                who TEXT,
                normalized_who TEXT
            )
        ''')
        
        # Toothbrush table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS toothbrush (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                duration INTEGER
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_event(self, event_type, timestamp, location=None, who=None):
        # Load name mapping
        try:
            with open('/app/data/name_mapping.json', 'r') as f:
                name_mapping = json.load(f)
        except:
            name_mapping = {}
        
        normalized_who = name_mapping.get(who.lower(), who) if who else None
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO events (type, timestamp, location, who, normalized_who)
            VALUES (?, ?, ?, ?, ?)
        ''', (event_type, timestamp, location, who, normalized_who))
        conn.commit()
        conn.close()
    
    def add_toothbrush(self, timestamp, duration=None):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO toothbrush (timestamp, duration)
            VALUES (?, ?)
        ''', (timestamp, duration))
        conn.commit()
        conn.close()
    
    def get_events(self, include_cum=False):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if include_cum:
            cursor.execute('SELECT * FROM events ORDER BY timestamp DESC')
        else:
            cursor.execute('SELECT * FROM events WHERE type != "cum" ORDER BY timestamp DESC')
        
        events = cursor.fetchall()
        conn.close()
        return events
    
    def get_toothbrush_data(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM toothbrush ORDER BY timestamp DESC')
        data = cursor.fetchall()
        conn.close()
        return data
    
    def import_google_forms_data(self, csv_file_path):
        """Import data from Google Forms CSV export"""
        import csv
        from datetime import datetime
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                # Adjust these mappings based on your Google Forms column names
                timestamp = row.get('Timestamp', '')
                event_type = row.get('Event Type', '').lower()
                location = row.get('Location', '')
                who = row.get('Who', '')
                
                if timestamp and event_type:
                    # Convert timestamp to ISO format if needed
                    try:
                        # Try to parse various timestamp formats
                        dt = datetime.strptime(timestamp, '%m/%d/%Y %H:%M:%S')
                        iso_timestamp = dt.isoformat()
                    except:
                        iso_timestamp = timestamp
                    
                    self.add_event(event_type, iso_timestamp, location, who)
        
        conn.commit()
        conn.close()
