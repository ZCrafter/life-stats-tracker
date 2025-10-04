// Configuration - Now using backend directly
// If using frontend container: use '/api'
// If using backend container only: use 'http://your-ip:5000/api'
// Use relative path - nginx will proxy to backend
const API_BASE = '/api';

// State
let currentEventType = null;
let currentDuration = null;
let includeCumStats = false;

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const eventBtns = document.querySelectorAll('.event-btn');
const cumBtn = document.getElementById('cum-btn');
const durationBtns = document.querySelectorAll('.duration-btn');
const toggleCumStatsBtn = document.getElementById('toggle-cum-stats');

// Initialize
// Test on startup
document.addEventListener('DOMContentLoaded', async function() {
    const connected = await testConnection();
    if (!connected) {
        alert('Cannot connect to backend. Please check the browser console for details.');
    }
    initEventListeners();
    updateToothbrushTime();
    setInterval(updateToothbrushTime, 1000);
    loadStats();
});

// Debug function
async function testConnection() {
    try {
        console.log('Testing connection to:', API_BASE);
        const response = await fetch(API_BASE + '/health');
        const data = await response.json();
        console.log('✅ Connection successful:', data);
        return true;
    } catch (error) {
        console.error('❌ Connection failed:', error);
        return false;
    }
}

function initEventListeners() {
    // Tab navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
            hideCumButton();
        });
    });

    // Event type selection
    eventBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('hidden')) return;
            
            eventBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentEventType = this.getAttribute('data-type');
        });
    });

    // Duration selection
    durationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            durationBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentDuration = parseInt(this.getAttribute('data-duration'));
        });
    });

    // Submit buttons
    document.getElementById('events-submit').addEventListener('click', submitEvent);
    document.getElementById('toothbrush-submit').addEventListener('click', submitToothbrush);
    
    // Header submit button - shows cum button
    document.getElementById('submitBtn').addEventListener('click', function() {
        switchTab('events');
        showCumButton();
    });

    // Toggle cum stats
    toggleCumStatsBtn.addEventListener('click', function() {
        includeCumStats = !includeCumStats;
        this.classList.toggle('active', includeCumStats);
        loadStats();
    });
}

function switchTab(tabName) {
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });

    if (tabName === 'stats') {
        loadStats();
    }
}

function showCumButton() {
    cumBtn.classList.remove('hidden');
}

function hideCumButton() {
    cumBtn.classList.add('hidden');
}

function updateToothbrushTime() {
    const now = new Date();
    document.getElementById('toothbrush-time').textContent = 
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function submitEvent() {
    if (!currentEventType) {
        alert('Please select an event type');
        return;
    }

    const timestamp = new Date().toISOString();
    const location = document.getElementById('location').value;
    const who = document.getElementById('who').value;

    try {
        const response = await fetch(`${API_BASE}/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: currentEventType,
                timestamp: timestamp,
                location: location,
                who: who
            })
        });

        if (response.ok) {
            alert('Event recorded successfully!');
            document.getElementById('location').value = '';
            document.getElementById('who').value = '';
            eventBtns.forEach(btn => btn.classList.remove('active'));
            currentEventType = null;
        } else {
            alert('Error recording event');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error recording event');
    }
}

async function submitToothbrush() {
    const timestamp = new Date().toISOString();

    try {
        const response = await fetch(`${API_BASE}/toothbrush`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timestamp: timestamp,
                duration: currentDuration
            })
        });

        if (response.ok) {
            alert('Toothbrush session recorded!');
            durationBtns.forEach(btn => btn.classList.remove('active'));
            currentDuration = null;
        } else {
            alert('Error recording toothbrush session');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error recording toothbrush session');
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats?include_cum=${includeCumStats}`);
        const stats = await response.json();

        document.getElementById('total-events').textContent = stats.total_events;
        document.getElementById('toothbrush-count').textContent = stats.toothbrush_count;

        updateEventsChart(stats.events_by_type);
        updatePeopleChart(stats.events_by_person);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateEventsChart(eventsByType) {
    const ctx = document.getElementById('events-chart').getContext('2d');
    
    if (window.eventsChart) {
        window.eventsChart.destroy();
    }

    const labels = Object.keys(eventsByType);
    const data = Object.values(eventsByType);
    const colors = {
        'pee': '#6366f1',
        'poo': '#f59e0b',
        'cum': '#ef4444'
    };

    window.eventsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Events',
                data: data,
                backgroundColor: labels.map(label => colors[label] || '#9ca3af'),
                borderColor: labels.map(label => colors[label] || '#9ca3af'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updatePeopleChart(eventsByPerson) {
    const ctx = document.getElementById('people-chart').getContext('2d');
    
    if (window.peopleChart) {
        window.peopleChart.destroy();
    }

    const labels = Object.keys(eventsByPerson);
    const data = Object.values(eventsByPerson);

    window.peopleChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#64748b'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Data Viewing Functions
function initDataViewListeners() {
    // Data tab buttons
    document.querySelectorAll('.data-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const dataType = this.getAttribute('data-data-type');
            switchDataTab(dataType);
        });
    });

    // Refresh data button
    document.getElementById('refresh-data').addEventListener('click', function() {
        loadDataView();
    });

    // Export CSV button
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
}

function switchDataTab(dataType) {
    // Update active data tab button
    document.querySelectorAll('.data-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-data-type') === dataType);
    });

    // Show active data table
    document.getElementById('events-data').classList.toggle('hidden', dataType !== 'events');
    document.getElementById('toothbrush-data').classList.toggle('hidden', dataType !== 'toothbrush');

    // Load data if needed
    if (dataType === 'events') {
        loadEventsData();
    } else if (dataType === 'toothbrush') {
        loadToothbrushData();
    }
}

async function loadDataView() {
    const activeDataType = document.querySelector('.data-tab-btn.active').getAttribute('data-data-type');
    if (activeDataType === 'events') {
        await loadEventsData();
    } else if (activeDataType === 'toothbrush') {
        await loadToothbrushData();
    }
}

async function loadEventsData() {
    try {
        const response = await fetch(`${API_BASE}/events?include_cum=true`);
        const events = await response.json();
        
        const tbody = document.getElementById('events-table-body');
        tbody.innerHTML = '';

        events.forEach(event => {
            const row = document.createElement('tr');
            const date = new Date(event.timestamp).toLocaleString();
            
            row.innerHTML = `
                <td>${event.id}</td>
                <td><span class="event-badge ${event.type}">${event.type}</span></td>
                <td>${date}</td>
                <td>${event.location || '-'}</td>
                <td>${event.who || '-'}</td>
                <td>${event.normalized_who || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading events data:', error);
    }
}

async function loadToothbrushData() {
    try {
        const response = await fetch(`${API_BASE}/toothbrush`);
        const data = await response.json();
        
        const tbody = document.getElementById('toothbrush-table-body');
        tbody.innerHTML = '';

        data.forEach(entry => {
            const row = document.createElement('tr');
            const date = new Date(entry.timestamp).toLocaleString();
            
            row.innerHTML = `
                <td>${entry.id}</td>
                <td>${date}</td>
                <td>${entry.duration || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading toothbrush data:', error);
    }
}

function exportToCSV() {
    const activeDataType = document.querySelector('.data-tab-btn.active').getAttribute('data-data-type');
    
    if (activeDataType === 'events') {
        exportEventsToCSV();
    } else if (activeDataType === 'toothbrush') {
        exportToothbrushToCSV();
    }
}

async function exportEventsToCSV() {
    try {
        const response = await fetch(`${API_BASE}/events?include_cum=true`);
        const events = await response.json();
        
        const headers = ['ID', 'Type', 'Timestamp', 'Location', 'Who', 'Normalized Who'];
        const csvData = events.map(event => [
            event.id,
            event.type,
            event.timestamp,
            event.location || '',
            event.who || '',
            event.normalized_who || ''
        ]);
        
        downloadCSV([headers, ...csvData], 'events_data.csv');
    } catch (error) {
        console.error('Error exporting events:', error);
    }
}

async function exportToothbrushToCSV() {
    try {
        const response = await fetch(`${API_BASE}/toothbrush`);
        const data = await response.json();
        
        const headers = ['ID', 'Timestamp', 'Duration'];
        const csvData = data.map(entry => [
            entry.id,
            entry.timestamp,
            entry.duration || ''
        ]);
        
        downloadCSV([headers, ...csvData], 'toothbrush_data.csv');
    } catch (error) {
        console.error('Error exporting toothbrush data:', error);
    }
}

function downloadCSV(data, filename) {
    const csvContent = data.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Update the initEventListeners function to include data view listeners
function initEventListeners() {
    // ... existing code ...
    
    // Add this line:
    initDataViewListeners();
}

// Update the switchTab function to handle data view tab
function switchTab(tabName) {
    // ... existing code ...

    // Load data if needed
    if (tabName === 'stats') {
        loadStats();
    } else if (tabName === 'data-view') {
        loadDataView();
    }
}
