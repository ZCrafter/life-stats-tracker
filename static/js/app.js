// State management
let currentEvent = null;
let currentLocation = null;
let currentVR = 0;
let currentFlosser = 0;
let cumVisible = false;
let statsSpicyVisible = false;
let selectedQuickName = null;
let editingEventId = null;
let editingDentalId = null;

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
    
    // Cancel buttons
    document.getElementById('bathroomCancel').addEventListener('click', cancelBathroomEdit);
    document.getElementById('dentalCancel').addEventListener('click', cancelDentalEdit);

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

async function loadTopNames() {
    try {
        const response = await fetch('/api/top-names');
        const topNames = await response.json();
        
        const grid = document.getElementById('quickNamesGrid');
        grid.innerHTML = '';
        
        topNames.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'quick-name-btn';
            btn.textContent = item.person;
            btn.dataset.name = item.person;
            btn.addEventListener('click', () => selectQuickName(item.person));
            grid.appendChild(btn);
        });
    } catch (error) {
        console.error('Error loading top names:', error);
    }
}

function selectQuickName(name) {
    selectedQuickName = name;
    
    // Update button states
    document.querySelectorAll('.quick-name-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.name === name) {
            btn.classList.add('active');
        }
    });
    
    // Auto-fill person1 field
    document.getElementById('person1').value = name;
}

function selectEvent(event) {
    const cumBtn = document.getElementById('cumBtn');
    
    // If clicking the hidden cum button, reveal it
    if (event === 'cum' && cumBtn.classList.contains('hidden-btn')) {
        cumBtn.classList.remove('hidden-btn');
        cumBtn.classList.add('revealed');
        cumVisible = true;
        // Don't select it yet, just reveal it
        return;
    }
    
    currentEvent = event;
    
    // Update button states
    document.querySelectorAll('.event-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.event === event) {
            btn.classList.add('active');
        }
    });

    // Update card background color
    const card = document.querySelector('#bathroom-screen .card');
    card.classList.remove('pee-selected', 'poo-selected', 'cum-selected');
    if (event) {
        card.classList.add(`${event}-selected`);
    }

    // Load top names if cum is selected
    if (event === 'cum') {
        loadTopNames();
    }
    
    // If selecting pee or poo, hide the cum button again
    if (event === 'pee' || event === 'poo') {
        cumBtn.classList.add('hidden-btn');
        cumBtn.classList.remove('revealed', 'active');
        cumVisible = false;
    }

    // Show/hide appropriate fields
    const locationGroup = document.getElementById('locationGroup');
    const vrGroup = document.getElementById('vrGroup');
    const whoGroup = document.getElementById('whoGroup');
    const quickNamesGroup = document.getElementById('quickNamesGroup');

    if (event === 'pee' || event === 'poo') {
        locationGroup.classList.remove('hidden');
        vrGroup.classList.add('hidden');
        whoGroup.classList.add('hidden');
        quickNamesGroup.classList.add('hidden');
    } else if (event === 'cum') {
        locationGroup.classList.add('hidden');
        vrGroup.classList.remove('hidden');
        whoGroup.classList.remove('hidden');
        quickNamesGroup.classList.remove('hidden');
    }
}

function hideCumButton() {
    const cumBtn = document.getElementById('cumBtn');
    cumBtn.classList.add('hidden-btn');
    cumBtn.classList.remove('active', 'revealed');
    cumVisible = false;
    
    // Reset card background
    const card = document.querySelector('#bathroom-screen .card');
    card.classList.remove('pee-selected', 'poo-selected', 'cum-selected');
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
        let response;
        if (editingEventId) {
            // Update existing event
            response = await fetch(`/api/bathroom/${editingEventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Create new event
            response = await fetch('/api/bathroom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            alert(editingEventId ? 'Event updated successfully!' : 'Event submitted successfully!');
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
        let response;
        if (editingDentalId) {
            // Update existing event
            response = await fetch(`/api/dental/${editingDentalId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Create new event
            response = await fetch('/api/dental', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            alert(editingDentalId ? 'Event updated successfully!' : 'Event submitted successfully!');
            resetDentalForm();
        }
    } catch (error) {
        alert('Error submitting event');
        console.error(error);
    }
}

function cancelBathroomEdit() {
    resetBathroomForm();
}

function cancelDentalEdit() {
    resetDentalForm();
}

function resetBathroomForm() {
    editingEventId = null;
    currentEvent = null;
    currentLocation = null;
    currentVR = 0;
    selectedQuickName = null;
    
    document.querySelectorAll('.event-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('[data-location]').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('[data-vr]').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.quick-name-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('person1').value = '';
    document.getElementById('person2').value = '';
    
    document.getElementById('locationGroup').classList.remove('hidden');
    document.getElementById('vrGroup').classList.add('hidden');
    document.getElementById('whoGroup').classList.add('hidden');
    document.getElementById('quickNamesGroup').classList.add('hidden');
    
    document.getElementById('bathroomCancel').classList.add('hidden');
    document.getElementById('bathroomSubmit').textContent = 'Submit Event';
    
    const card = document.querySelector('#bathroom-screen .card');
    card.classList.remove('pee-selected', 'poo-selected', 'cum-selected');
    
    hideCumButton();
    initDateTime();
}

function resetDentalForm() {
    editingDentalId = null;
    currentFlosser = 0;
    document.querySelectorAll('[data-flosser]').forEach(btn => btn.classList.remove('active'));
    document.getElementById('dentalCancel').classList.add('hidden');
    document.getElementById('dentalSubmit').textContent = 'Submit Event';
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
        renderLeaderboard(data.person_stats);
        renderSpicyChart(data.person_stats);
        renderDentalChart(data.dental_stats);
        renderRecentEvents(data.recent_bathroom, data.recent_dental);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function renderLeaderboard(data) {
    const container = document.getElementById('leaderboard');
    container.innerHTML = '';
    
    if (data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No data yet</p>';
        return;
    }
    
    data.forEach((item, index) => {
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = 'leaderboard-item';
        
        let rankClass = '';
        let rankEmoji = '';
        if (index === 0) {
            rankClass = 'gold';
            rankEmoji = '🥇';
        } else if (index === 1) {
            rankClass = 'silver';
            rankEmoji = '🥈';
        } else if (index === 2) {
            rankClass = 'bronze';
            rankEmoji = '🥉';
        }
        
        leaderboardItem.innerHTML = `
            <span class="leaderboard-rank ${rankClass}">${rankEmoji || (index + 1)}</span>
            <span class="leaderboard-name">${item.person}</span>
            <span class="leaderboard-count">${item.count}</span>
        `;
        
        container.appendChild(leaderboardItem);
    });
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
        
        let details = `${event.event_type}`;
        if (event.location) details += ` (${event.location})`;
        if (event.person1) details += ` - ${event.person1}`;
        
        item.innerHTML = `
            <span>${details} - ${new Date(event.timestamp).toLocaleString()}</span>
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
            <span>Brushed${event.used_flosser ? ' + Flossed' : ''} - ${new Date(event.timestamp).toLocaleString()}</span>
            <div class="event-actions">
                <button class="edit-btn" onclick="editDentalEvent(${event.id})">Edit</button>
                <button class="delete-btn" onclick="deleteDentalEvent(${event.id})">Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

async function editBathroomEvent(id) {
    try {
        // Fetch the event data
        const response = await fetch('/api/stats');
        const data = await response.json();
        const event = data.recent_bathroom.find(e => e.id === id);
        
        if (!event) {
            alert('Event not found');
            return;
        }
        
        // Switch to bathroom screen
        document.querySelector('[data-screen="bathroom"]').click();
        
        // Set editing mode
        editingEventId = id;
        
        // If it's a cum event, reveal the button first
        const cumBtn = document.getElementById('cumBtn');
        if (event.event_type === 'cum') {
            cumBtn.classList.remove('hidden-btn');
            cumBtn.classList.add('revealed');
            cumVisible = true;
        }
        
        // Populate form
        document.getElementById('bathroomDateTime').value = event.timestamp;
        selectEvent(event.event_type);
        
        if (event.location) {
            selectLocation(event.location);
        }
        
        if (event.event_type === 'cum') {
            selectVR(event.in_vr || 0);
            document.getElementById('person1').value = event.person1 || '';
            document.getElementById('person2').value = event.person2 || '';
        }
        
        // Update UI
        document.getElementById('bathroomSubmit').textContent = 'Update Event';
        document.getElementById('bathroomCancel').classList.remove('hidden');
        
        // Scroll to top
        window.scrollTo(0, 0);
    } catch (error) {
        alert('Error loading event for editing');
        console.error(error);
    }
}

async function editDentalEvent(id) {
    try {
        // Fetch the event data
        const response = await fetch('/api/stats');
        const data = await response.json();
        const event = data.recent_dental.find(e => e.id === id);
        
        if (!event) {
            alert('Event not found');
            return;
        }
        
        // Switch to dental screen
        document.querySelector('[data-screen="dental"]').click();
        
        // Set editing mode
        editingDentalId = id;
        
        // Populate form
        document.getElementById('dentalDateTime').value = event.timestamp;
        selectFlosser(event.used_flosser || 0);
        
        // Update UI
        document.getElementById('dentalSubmit').textContent = 'Update Event';
        document.getElementById('dentalCancel').classList.remove('hidden');
        
        // Scroll to top
        window.scrollTo(0, 0);
    } catch (error) {
        alert('Error loading event for editing');
        console.error(error);
    }
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
