# backend/models.py
import psycopg2
import os

def init_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            subtype VARCHAR(50),
            who VARCHAR(100),
            location VARCHAR(50),
            timestamp TIMESTAMP NOT NULL,
            screen VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()
    print("Database initialized successfully")
