from flask import Flask, request, jsonify
from flask_cors import CORS
from database import Database
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Initialize database
db = Database()

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
    
    # Convert to list of dicts
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
    # Get basic stats
    events = db.get_events(include_cum=True)
    toothbrush_data = db.get_toothbrush_data()
    
    # Calculate stats
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

@app.route('/api/import', methods=['POST'])
def import_data():
    """Endpoint to import Google Forms data"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and file.filename.endswith('.csv'):
        # Save uploaded file temporarily
        file_path = f"/tmp/{file.filename}"
        file.save(file_path)
        
        # Import data
        db.import_google_forms_data(file_path)
        
        # Clean up
        os.remove(file_path)
        
        return jsonify({'status': 'success', 'message': 'Data imported successfully'})
    
    return jsonify({'error': 'Invalid file format. Please upload a CSV file.'}), 400

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
