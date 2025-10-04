from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from database import Database
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Initialize database
db = Database()

# Serve frontend static files
@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

# API Routes (same as before)
@app.route('/api/event', methods=['POST'])
def add_event():
    data = request.json
    db.add_event(
        data['type'],
        data['timestamp'],
        data.get('location'),
        data.get('who')
    )
    return jsonify({'status': 'success'})

@app.route('/api/toothbrush', methods=['POST'])
def add_toothbrush():
    data = request.json
    db.add_toothbrush(
        data['timestamp'],
        data.get('duration')
    )
    return jsonify({'status': 'success'})

@app.route('/api/events', methods=['GET'])
def get_events():
    include_cum = request.args.get('include_cum', 'false').lower() == 'true'
    events = db.get_events(include_cum)
    
    result = []
    for event in events:
        result.append({
            'id': event[0],
            'type': event[1],
            'timestamp': event[2],
            'location': event[3],
            'who': event[4],
            'normalized_who': event[5]
        })
    
    return jsonify(result)

@app.route('/api/toothbrush', methods=['GET'])
def get_toothbrush():
    data = db.get_toothbrush_data()
    
    result = []
    for entry in data:
        result.append({
            'id': entry[0],
            'timestamp': entry[1],
            'duration': entry[2]
        })
    
    return jsonify(result)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    events = db.get_events(include_cum=True)
    toothbrush_data = db.get_toothbrush_data()
    
    stats = {
        'total_events': len(events),
        'events_by_type': {},
        'toothbrush_count': len(toothbrush_data),
        'events_by_person': {}
    }
    
    for event in events:
        event_type = event[1]
        normalized_who = event[5]
        
        stats['events_by_type'][event_type] = stats['events_by_type'].get(event_type, 0) + 1
        
        if normalized_who:
            stats['events_by_person'][normalized_who] = stats['events_by_person'].get(normalized_who, 0) + 1
    
    return jsonify(stats)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
