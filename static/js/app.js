// State management
let currentEvent = null;
let currentLocation = null;
let currentVR = 0;
let currentFlosser = 0;
let cumVisible = false;
let statsSpicyVisible = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDateTime();
    initEventListeners();
    checkURLParams();
});

function checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    const datetime = params.get('datetime');
    
    if (datetime) {
        document.getElementById('bathroomDateTime').value = datetime;
        document.getElementById('dentalDateTime').value = datetime;
    }
}

function initDateTime() {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    
    document.getElementById('bathroomDateTime').value = localDateTime;
    document.getElementById('dentalDateTime').value = localDateTime;
}

function initEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const screen = tab.dataset.screen;
            switchScreen(screen);
        });
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Bathroom event buttons
    document.querySelectorAll('.event-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectEvent(btn.dataset.event);
        });
    });

    // Location buttons
    document.querySelectorAll('[data-location]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectLocation(btn.dataset.location);
        });
    });

    // VR buttons
    document.querySelectorAll('[data-vr]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectVR(parseInt(btn.dataset.vr));
        });
    });

    // Flosser buttons
    document.querySelectorAll('[data-flosser]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectFlosser(parseInt(btn.dataset.flosser));
        });
    });

    // Submit buttons
    document.getElementById('bathroomSubmit').addEventListener('click', submitBathroomEvent);
    document.getElementById('dentalSubmit').addEventListener('click', submitDentalEvent);

    // Stats toggle
    document.getElementById('statsToggle').addEventListener('click', toggleSpicyStats);
}

function switchScreen(screen) {
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.screen === screen) {
            tab.classList.add('active');
        }
    });

    // Update screens
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    document.getElementById(`${screen}-screen`).classList.add('active');

    // Hide cum button when switching screens
    if (screen !== 'bathroom') {
        hideCumButton();
    }

    // Load stats if stats screen
    if (screen === 'stats') {
        loadStats();
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

function selectEvent(event) {
    currentEvent = event;
    
    // Update button states
    document.querySelectorAll('.event-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.event === event) {
            btn.classList.add('active');
        }
    });

    // Show cum button if cum is selected
    if (event === 'cum') {
        document.getElementById('cumBtn').classList.add('active');
        cumVisible = true;
    }

    // Show/hide appropriate fields
    const locationGroup = document.getElementById('locationGroup');
    const vrGroup = document.getElementById('vrGroup');
    const whoGroup = document.getElementById('whoGroup');

    if (event === 'pee' || event === 'poo') {
        locationGroup.classList.remove('hidden');
        vrGroup.classList.add('hidden');
        whoGroup.classList.add('hidden');
    } else if (event === 'cum') {
        locationGroup.classList.add('hidden');
        vrGroup.classList.remove('hidden');
        whoGroup.classList.remove('hidden');
    }
}

function hideCumButton() {
    if (!document.querySelector('.event-btn.active[data-event="cum"]')) {
        document.getElementById('cumBtn').classList.remove('active');
        cumVisible = false;
    }
}

function selectLocation(location) {
    currentLocation = location;
    document.querySelectorAll('[data-location]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.location === location) {
            btn.classList.add('active');
        }
    });
}

function selectVR(vr) {
    currentVR = vr;
    document.querySelectorAll('[data-vr]').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.vr) === vr) {
            btn.classList.add('active');
        }
    });
}

function selectFlosser(flosser) {
    currentFlosser = flosser;
    document.querySelectorAll('[data-flosser]').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.flosser) === flosser) {
            btn.classList.add('active');
        }
    });
}

async function submitBathroomEvent() {
    if (!currentEvent) {
        alert('Please select an event type');
        return;
    }

    const timestamp = document.getElementById('bathroomDateTime').value;
    if (!timestamp) {
        alert('Please select date and time');
        return;
    }

    const data = {
        event_type: currentEvent,
        timestamp: timestamp,
        location: currentLocation,
        in_vr: currentVR,
        person1: document.getElementById('person1').value || null,
        person2: document.getElementById('person2').value || null
    };

    try {
        const response = await fetch('/api/bathroom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Event submitted successfully!');
            resetBathroomForm();
        }
    } catch (error) {
        alert('Error submitting event');
        console.error(error);
    }
}

async function submitDentalEvent() {
    const timestamp = document.getElementById('dentalDateTime').value;
    if (!timestamp) {
        alert('Please select date and time');
        return;
    }

    const data = {
        timestamp: timestamp,
        used_flosser: currentFlosser
    };

    try {
        const response = await fetch('/api/dental', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Event submitted successfully!');
            resetDentalForm();
        }
    } catch (error) {
        alert('Error submitting event');
        console.error(error);
    }
}

function resetBathroomForm() {
    currentEvent = null;
    currentLocation = null;
    currentVR = 0;
    
    document.querySelectorAll('.event-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('[data-location]').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('[data-vr]').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('person1').value = '';
    document.getElementById('person2').value = '';
    
    document.getElementById('locationGroup').classList.remove('hidden');
    document.getElementById('vrGroup').classList.add('hidden');
    document.getElementById('whoGroup').classList.add('hidden');
    
    hideCumButton();
    initDateTime();
}

function resetDentalForm() {
    currentFlosser = 0;
    document.querySelectorAll('[data-flosser]').forEach(btn => btn.classList.remove('active'));
    initDateTime();
}

function toggleSpicyStats() {
    statsSpicyVisible = !statsSpicyVisible;
    const toggle = document.getElementById('statsToggle');
    const section = document.getElementById('spicyStats');
    
    if (statsSpicyVisible) {
        toggle.classList.add('active');
        section.classList.remove('hidden');
    } else {
        toggle.classList.remove('active');
        section.classList.add('hidden');
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        renderTimelineChart(data.bathroom_stats);
        renderLocationChart(data.location_stats);
        renderSpicyChart(data.person_stats);
        renderDentalChart(data.dental_stats);
        renderRecentEvents(data.recent_bathroom, data.recent_dental);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function renderTimelineChart(data) {
    const grouped = {};
    data.forEach(item => {
        if (!grouped[item.event_type]) {
            grouped[item.event_type] = { dates: [], counts: [] };
        }
        grouped[item.event_type].dates.push(item.date);
        grouped[item.event_type].counts.push(item.count);
    });

    const traces = Object.keys(grouped).map(type => ({
        x: grouped[type].dates,
        y: grouped[type].counts,
        type: 'scatter',
        mode: 'lines+markers',
        name: type.charAt(0).toUpperCase() + type.slice(1)
    }));

    const layout = {
        title: 'Events Over Time',
        xaxis: { title: 'Date' },
        yaxis: { title: 'Count' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('timelineChart', traces, layout, { responsive: true });
}

function renderLocationChart(data) {
    const traces = [{
        x: data.map(d => d.event_type + ' - ' + d.location),
        y: data.map(d => d.count),
        type: 'bar'
    }];

    const layout = {
        title: 'Events by Location',
        xaxis: { title: 'Event & Location' },
        yaxis: { title: 'Count' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('locationChart', traces, layout, { responsive: true });
}

function renderSpicyChart(data) {
    const traces = [{
        labels: data.map(d => d.person),
        values: data.map(d => d.count),
        type: 'pie'
    }];

    const layout = {
        title: 'Distribution by Person',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('spicyChart', traces, layout, { responsive: true });
}

function renderDentalChart(data) {
    const traces = [
        {
            x: data.map(d => d.date),
            y: data.map(d => d.brush_count),
            type: 'bar',
            name: 'Brushing'
        },
        {
            x: data.map(d => d.date),
            y: data.map(d => d.floss_count),
            type: 'bar',
            name: 'Flossing'
        }
    ];

    const layout = {
        title: 'Dental Care Over Time',
        xaxis: { title: 'Date' },
        yaxis: { title: 'Count' },
        barmode: 'group',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('dentalChart', traces, layout, { responsive: true });
}

function renderRecentEvents(bathroom, dental) {
    const container = document.getElementById('recentEvents');
    container.innerHTML = '<h4>Recent Bathroom Events</h4>';
    
    bathroom.slice(0, 10).forEach(event => {
        const item = document.createElement('div');
        item.className = 'event-item';
        item.innerHTML = `
            <span>${event.event_type} - ${new Date(event.timestamp).toLocaleString()}</span>
            <div class="event-actions">
                <button class="edit-btn" onclick="editBathroomEvent(${event.id})">Edit</button>
                <button class="delete-btn" onclick="deleteBathroomEvent(${event.id})">Delete</button>
            </div>
        `;
        container.appendChild(item);
    });

    container.innerHTML += '<h4 style="margin-top: 20px;">Recent Dental Events</h4>';
    
    dental.slice(0, 10).forEach(event => {
        const item = document.createElement('div');
        item.className = 'event-item';
        item.innerHTML = `
            <span>Brushed - ${new Date(event.timestamp).toLocaleString()}</span>
            <div class="event-actions">
                <button class="delete-btn" onclick="deleteDentalEvent(${event.id})">Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

async function deleteBathroomEvent(id) {
    if (!confirm('Delete this event?')) return;
    
    try {
        await fetch(`/api/bathroom/${id}`, { method: 'DELETE' });
        loadStats();
    } catch (error) {
        alert('Error deleting event');
    }
}

async function deleteDentalEvent(id) {
    if (!confirm('Delete this event?')) return;
    
    try {
        await fetch(`/api/dental/${id}`, { method: 'DELETE' });
        loadStats();
    } catch (error) {
        alert('Error deleting event');
    }
}

function editBathroomEvent(id) {
    alert('Edit functionality: Switch to Events tab and manually re-enter. Full edit UI coming soon!');
}
