from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_PATH = 'data/life_stats.db'
MAPPINGS_PATH = 'name_mappings.json'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def load_name_mappings():
    if os.path.exists(MAPPINGS_PATH):
        with open(MAPPINGS_PATH, 'r') as f:
            return json.load(f)
    return {}

def save_name_mappings(mappings):
    with open(MAPPINGS_PATH, 'w') as f:
        json.dump(mappings, f, indent=2)

def normalize_name(name, mappings):
    if not name:
        return name
    name_lower = name.lower().strip()
    for canonical, variants in mappings.items():
        if name_lower in [v.lower() for v in variants] or name_lower == canonical.lower():
            return canonical
    return name

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/bathroom', methods=['POST'])
def add_bathroom_event():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    
    mappings = load_name_mappings()
    person1 = normalize_name(data.get('person1'), mappings) if data.get('person1') else None
    person2 = normalize_name(data.get('person2'), mappings) if data.get('person2') else None
    
    c.execute('''INSERT INTO bathroom_events 
                 (event_type, timestamp, location, in_vr, person1, person2)
                 VALUES (?, ?, ?, ?, ?, ?)''',
              (data['event_type'], data['timestamp'], data.get('location'),
               data.get('in_vr', 0), person1, person2))
    
    conn.commit()
    event_id = c.lastrowid
    conn.close()
    
    return jsonify({'success': True, 'id': event_id})

@app.route('/api/dental', methods=['POST'])
def add_dental_event():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''INSERT INTO dental_events (timestamp, used_flosser)
                 VALUES (?, ?)''',
              (data['timestamp'], data.get('used_flosser', 0)))
    
    conn.commit()
    event_id = c.lastrowid
    conn.close()
    
    return jsonify({'success': True, 'id': event_id})

@app.route('/api/bathroom/<int:event_id>', methods=['DELETE'])
def delete_bathroom_event(event_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM bathroom_events WHERE id = ?', (event_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/dental/<int:event_id>', methods=['DELETE'])
def delete_dental_event(event_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM dental_events WHERE id = ?', (event_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/bathroom/<int:event_id>', methods=['PUT'])
def update_bathroom_event(event_id):
    data = request.json
    conn = get_db()
    c = conn.cursor()
    
    mappings = load_name_mappings()
    person1 = normalize_name(data.get('person1'), mappings) if data.get('person1') else None
    person2 = normalize_name(data.get('person2'), mappings) if data.get('person2') else None
    
    c.execute('''UPDATE bathroom_events 
                 SET event_type=?, timestamp=?, location=?, in_vr=?, person1=?, person2=?
                 WHERE id=?''',
              (data['event_type'], data['timestamp'], data.get('location'),
               data.get('in_vr', 0), person1, person2, event_id))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/dental/<int:event_id>', methods=['PUT'])
def update_dental_event(event_id):
    data = request.json
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''UPDATE dental_events 
                 SET timestamp=?, used_flosser=?
                 WHERE id=?''',
              (data['timestamp'], data.get('used_flosser', 0), event_id))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/stats')
def get_stats():
    conn = get_db()
    c = conn.cursor()
    
    # Get bathroom stats
    c.execute('''SELECT event_type, COUNT(*) as count,
                 DATE(timestamp) as date
                 FROM bathroom_events
                 GROUP BY event_type, DATE(timestamp)
                 ORDER BY date DESC''')
    bathroom_stats = [dict(row) for row in c.fetchall()]
    
    c.execute('''SELECT event_type, location, COUNT(*) as count
                 FROM bathroom_events
                 WHERE location IS NOT NULL
                 GROUP BY event_type, location''')
    location_stats = [dict(row) for row in c.fetchall()]
    
    c.execute('''SELECT person1 as person, COUNT(*) as count
                 FROM bathroom_events
                 WHERE event_type = 'cum' AND person1 IS NOT NULL
                 GROUP BY person1
                 ORDER BY count DESC
                 LIMIT 10''')
    person_stats = [dict(row) for row in c.fetchall()]
    
    # Get dental stats
    c.execute('''SELECT DATE(timestamp) as date, 
                 COUNT(*) as brush_count,
                 SUM(used_flosser) as floss_count
                 FROM dental_events
                 GROUP BY DATE(timestamp)
                 ORDER BY date DESC''')
    dental_stats = [dict(row) for row in c.fetchall()]
    
    # Get recent events for editing
    c.execute('''SELECT id, event_type, timestamp, location, in_vr, person1, person2
                 FROM bathroom_events
                 ORDER BY timestamp DESC
                 LIMIT 50''')
    recent_bathroom = [dict(row) for row in c.fetchall()]
    
    c.execute('''SELECT id, timestamp, used_flosser
                 FROM dental_events
                 ORDER BY timestamp DESC
                 LIMIT 50''')
    recent_dental = [dict(row) for row in c.fetchall()]
    
    conn.close()
    
    return jsonify({
        'bathroom_stats': bathroom_stats,
        'location_stats': location_stats,
        'person_stats': person_stats,
        'dental_stats': dental_stats,
        'recent_bathroom': recent_bathroom,
        'recent_dental': recent_dental
    })

@app.route('/api/top-names')
def get_top_names():
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''SELECT person1 as person, COUNT(*) as count
                 FROM bathroom_events
                 WHERE event_type = 'cum' AND person1 IS NOT NULL
                 GROUP BY person1
                 ORDER BY count DESC
                 LIMIT 3''')
    top_names = [dict(row) for row in c.fetchall()]
    
    conn.close()
    return jsonify(top_names)

@app.route('/api/mappings', methods=['GET'])
def get_mappings():
    mappings = load_name_mappings()
    return jsonify(mappings)

@app.route('/api/mappings', methods=['POST'])
def update_mappings():
    mappings = request.json
    save_name_mappings(mappings)
    return jsonify({'success': True})

@app.route('/api/import/bathroom', methods=['POST'])
def import_bathroom():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    
    mappings = load_name_mappings()
    count = 0
    
    for event in data:
        person1 = normalize_name(event.get('person1'), mappings) if event.get('person1') else None
        person2 = normalize_name(event.get('person2'), mappings) if event.get('person2') else None
        
        c.execute('''INSERT INTO bathroom_events 
                     (event_type, timestamp, location, in_vr, person1, person2)
                     VALUES (?, ?, ?, ?, ?, ?)''',
                  (event['event_type'], event['timestamp'], event.get('location'),
                   event.get('in_vr', 0), person1, person2))
        count += 1
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'imported': count})

@app.route('/api/import/dental', methods=['POST'])
def import_dental():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    
    count = 0
    for event in data:
        c.execute('''INSERT INTO dental_events (timestamp, used_flosser)
                     VALUES (?, ?)''',
                  (event['timestamp'], event.get('used_flosser', 0)))
        count += 1
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'imported': count})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
