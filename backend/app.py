# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import psycopg2
from models import init_db

app = Flask(__name__)
CORS(app)

# Initialize database on startup
init_db()

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

@app.route('/api/events', methods=['POST'])
def add_event():
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO events (type, subtype, who, location, timestamp, screen) VALUES (%s, %s, %s, %s, %s, %s)',
        (data['type'], data.get('subtype'), data.get('who'), data.get('location'), data['timestamp'], data['screen'])
    )
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/events', methods=['GET'])
def get_events():
    screen = request.args.get('screen')
    conn = get_db_connection()
    cur = conn.cursor()
    if screen:
        cur.execute('SELECT * FROM events WHERE screen = %s ORDER BY timestamp DESC', (screen,))
    else:
        cur.execute('SELECT * FROM events ORDER BY timestamp DESC')
    
    columns = [desc[0] for desc in cur.description]
    events = []
    for row in cur.fetchall():
        events.append(dict(zip(columns, row)))
    
    cur.close()
    conn.close()
    return jsonify(events)

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM events WHERE id = %s', (event_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'deleted'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)  # Explicitly set port 5000
