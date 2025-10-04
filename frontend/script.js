// Configuration - Updated for Docker
const API_BASE = '/api';  // Now using relative path through nginx proxy

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
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    updateToothbrushTime();
    setInterval(updateToothbrushTime, 1000);
    loadStats();
});

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
    // Update active tab button
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    // Show active tab pane
    tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });

    // Load data if needed
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
            // Clear form
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

        // Update basic stats
        document.getElementById('total-events').textContent = stats.total_events;
        document.getElementById('toothbrush-count').textContent = stats.toothbrush_count;

        // Update charts
        updateEventsChart(stats.events_by_type);
        updatePeopleChart(stats.events_by_person);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateEventsChart(eventsByType) {
    const ctx = document.getElementById('events-chart').getContext('2d');
    
    // Destroy existing chart if it exists
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
    
    // Destroy existing chart if it exists
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
