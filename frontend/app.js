// frontend/app.js
class LifeStatsApp {
    constructor() {
        this.currentScreen = 'bathroom';
        this.selectedEvent = null;
        this.cumVisible = false;
        this.nameMapping = {}; // Load from localStorage
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadNameMapping();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showScreen(e.target.dataset.screen);
                this.hideCumButton();
            });
        });

        // Event buttons
        document.querySelectorAll('.event-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectEvent(e.target);
            });
        });

        // Secret button for cum
        document.querySelector('.secret-btn').addEventListener('click', () => {
            this.toggleCumButton();
        });

        // Submit buttons
        document.getElementById('bathroom-submit').addEventListener('click', () => {
            this.submitBathroomEvent();
        });

        // Add more event listeners...
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(screenName).classList.add('active');
        document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');
        this.currentScreen = screenName;
    }

    toggleCumButton() {
        const cumBtn = document.querySelector('.event-btn.cum');
        this.cumVisible = !this.cumVisible;
        cumBtn.classList.toggle('hidden', !this.cumVisible);
    }

    hideCumButton() {
        this.cumVisible = false;
        document.querySelector('.event-btn.cum').classList.add('hidden');
    }

    selectEvent(button) {
        document.querySelectorAll('.event-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');
        this.selectedEvent = button.dataset;
    }

    async submitBathroomEvent() {
        if (!this.selectedEvent) return;

        const eventData = {
            type: this.selectedEvent.type,
            subtype: this.selectedEvent.subtype,
            who: this.mapName(document.getElementById('who-input').value),
            location: document.querySelector('input[name="location"]:checked').value,
            timestamp: new Date().toISOString(),
            screen: 'bathroom'
        };

        await this.apiCall('/api/events', 'POST', eventData);
        this.resetForm();
    }

    mapName(name) {
        return this.nameMapping[name.toLowerCase()] || name;
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.body = JSON.stringify(data);
        
        const response = await fetch(`http://localhost:5000${endpoint}`, options);
        return await response.json();
    }

    resetForm() {
        this.selectedEvent = null;
        document.querySelectorAll('.event-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('who-input').value = '';
    }
}

// Initialize app
new LifeStatsApp();
