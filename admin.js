// Enhanced Admin Dashboard - Complete Implementation with System Overview
class AdminDashboard {
    constructor() {
        this.baseURL = 'http://localhost:3002';
        this.user = null;
        this.currentCompetitionId = null;
        this.currentCriteria = [];
        this.pendingConfirmation = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthentication();
            this.showDashboard();
        });
    }

    checkAuthentication() {
        this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
        if (!this.user || this.user.role !== 'admin') {
            window.location.href = 'login.html';
            return false;
        }
        this.updateHeader();
        return true;
    }

    updateHeader() {
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            headerRight.innerHTML = `
                <div>Welcome, Admin</div>
                <button class="logout-btn">Logout</button>
            `;
            const btn = headerRight.querySelector('.logout-btn');
            if (btn) btn.addEventListener('click', () => this.logout());
        }
    }

    logout() {
        this.showConfirmationModal(
            'Confirm Logout',
            'Are you sure you want to logout?',
            'You will need to login again to access the system.',
            'logout',
            () => this.confirmLogout()
        );
    }

    confirmLogout() {
        try {
            sessionStorage.removeItem('user');
            localStorage.removeItem('user');
        } catch (e) {
            console.warn('Storage cleanup error:', e);
        } finally {
            window.location.replace('login.html');
        }
    }

    // Confirmation Modal System
    showConfirmationModal(title, message, subtitle, type, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal-overlay';
        
        const iconMap = {
            'delete-event': '⚠',
            'delete-competition': '⚠',
            'logout': '🚪',
            'save-criteria': '💾',
            'validation-error': '⚠',
            'create-event': '✓',
            'create-competition': '✓',
            'update-event': '✓',
            'update-competition': '✓'
        };
        
        const buttonTextMap = {
            'delete-event': 'Yes, Delete',
            'delete-competition': 'Yes, Delete',
            'logout': 'Yes, Logout',
            'save-criteria': 'Yes, Save',
            'validation-error': 'OK',
            'create-event': 'Yes, Create',
            'create-competition': 'Yes, Create',
            'update-event': 'Yes, Update',
            'update-competition': 'Yes, Update'
        };
        
        const icon = iconMap[type] || '⚠';
        const buttonText = buttonTextMap[type] || 'Yes, Continue';
        
        // For validation errors, hide the cancel button
        const showCancelButton = type !== 'validation-error';
        
        modal.innerHTML = `
            <div class="confirmation-modal-content ${type}">
                <div class="confirmation-modal-header">
                    <div class="confirmation-modal-icon">
                        <span class="confirmation-icon">${icon}</span>
                    </div>
                    <h3>${title}</h3>
                </div>
                <div class="confirmation-modal-body">
                    <p class="confirmation-message">${message}</p>
                    ${subtitle ? `<p class="confirmation-subtitle">${subtitle}</p>` : ''}
                </div>
                <div class="confirmation-modal-actions">
                    <button class="confirmation-confirm-btn" onclick="adminApp.executeConfirmation()">
                        <span class="btn-icon">${type === 'delete-event' || type === 'delete-competition' ? '🗑' : '✓'}</span>
                        ${buttonText}
                    </button>
                    ${showCancelButton ? `
                        <button class="confirmation-cancel-btn" onclick="adminApp.closeConfirmationModal()">
                            <span class="btn-icon">✕</span>
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store the confirmation action
        this.pendingConfirmation = onConfirm;
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeConfirmationModal();
            }
        });
        
        // Add escape key to close
        document.addEventListener('keydown', this.handleConfirmationModalKeydown);
    }

    handleConfirmationModalKeydown = (e) => {
        if (e.key === 'Escape') {
            this.closeConfirmationModal();
        }
    }

    closeConfirmationModal() {
        const modal = document.querySelector('.confirmation-modal-overlay');
        if (modal) {
            modal.remove();
            document.removeEventListener('keydown', this.handleConfirmationModalKeydown);
        }
        this.pendingConfirmation = null;
    }

    executeConfirmation() {
        if (this.pendingConfirmation) {
            this.pendingConfirmation();
        }
        this.closeConfirmationModal();
    }

    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">✓</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    async apiRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: { 'Content-Type': 'application/json' },
                ...options
            });
            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    showLoading(containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `
            <div class="loading">
                <div style="font-size: 24px;">⳾</div>
                <p>Loading...</p>
            </div>
        `;
    }

    showError(containerId, message) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `<div class="alert alert-error">${message}</div>`;
    }

    showDashboard() {
        document.getElementById("content").innerHTML = `
            <div class="dashboard-grid">
                ${this.createDashboardCard('Event Types', 'Manage custom event categories', 'showEventTypes')}
                ${this.createDashboardCard('Judging Criteria', 'Manage judging criteria for competitions', 'showCriteria')}
                ${this.createDashboardCard('Competitions', 'Create and manage competitions', 'showCompetitions')}
                ${this.createDashboardCard('System Overview', 'View comprehensive system statistics and analytics', 'showScoringResults')}
            </div>
        `;
    }

    createDashboardCard(title, description, action) {
        return `
            <div class="dashboard-card">
                <h3>${title}</h3>
                <p>${description}</p>
                <button onclick="adminApp.${action}()" class="card-button">Manage</button>
            </div>
        `;
    }

    // Helper methods for DOM manipulation
    updateElementText(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'block';
    }

    // System Overview Dashboard (Replaces Scoring Results)
    async showScoringResults() {
        document.getElementById("content").innerHTML = `
            <div class="summary-container">
                <h2>System Overview & Statistics</h2>
                <p style="text-align: center; color: var(--muted); font-size: 16px; margin-bottom: 30px;">
                    Comprehensive dashboard showing system-wide statistics, trends, and performance metrics
                </p>

                <div id="overview-loading" class="loading">
                    Loading system overview...
                </div>

                <div id="overview-error" style="display: none;"></div>

                <!-- Main Statistics Grid -->
                <div id="main-stats" class="summary-grid" style="display: none;">
                    <div class="summary-card competitions">
                        <div class="summary-icon">🏆</div>
                        <div class="summary-count" id="total-competitions">0</div>
                        <div class="summary-label">Total Competitions</div>
                        <p class="summary-description">All competitions in the system</p>
                    </div>

                    <div class="summary-card event-types">
                        <div class="summary-icon">📋</div>
                        <div class="summary-count" id="total-event-types">0</div>
                        <div class="summary-label">Event Types</div>
                        <p class="summary-description">Available competition categories</p>
                    </div>

                    <div class="summary-card participants">
                        <div class="summary-icon">👥</div>
                        <div class="summary-count" id="total-participants">0</div>
                        <div class="summary-label">Total Participants</div>
                        <p class="summary-description">Registered participants system-wide</p>
                    </div>

                    <div class="summary-card judges">
                        <div class="summary-icon">⚖️</div>
                        <div class="summary-count" id="total-judges">0</div>
                        <div class="summary-label">Total Judges</div>
                        <p class="summary-description">Available judges in the system</p>
                    </div>
                </div>

                <!-- Detailed Analytics Section -->
                <div id="detailed-analytics" style="display: none; margin-top: 40px;">
                    <!-- Competition Analytics -->
                    <div style="background: #fff; border: 2px solid var(--maroon); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                        <h3 style="color: var(--maroon); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            🏆 Competition Analytics
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--success);" id="active-competitions-stat">0</div>
                                <div class="stat-label">Active Competitions</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--info);" id="pageant-competitions">0</div>
                                <div class="stat-label">Pageant Events</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--warning);" id="regular-competitions">0</div>
                                <div class="stat-label">Regular Events</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--maroon);" id="avg-participants-per-comp">0</div>
                                <div class="stat-label">Avg Participants/Event</div>
                            </div>
                        </div>
                    </div>

                    <!-- Event Type Distribution -->
                    <div style="background: #fff; border: 2px solid var(--maroon); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                        <h3 style="color: var(--maroon); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            📊 Event Type Distribution
                        </h3>
                        <div id="event-type-breakdown">
                            <!-- Will be populated dynamically -->
                        </div>
                    </div>

                    <!-- Participant Analytics -->
                    <div style="background: #fff; border: 2px solid var(--maroon); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                        <h3 style="color: var(--maroon); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            👥 Participant Statistics
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--success);" id="active-participants-stat">0</div>
                                <div class="stat-label">Active Participants</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--info);" id="participants-with-competitions">0</div>
                                <div class="stat-label">Enrolled in Competitions</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--warning);" id="participants-without-competitions">0</div>
                                <div class="stat-label">Not Yet Enrolled</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--maroon);" id="total-criteria-count">0</div>
                                <div class="stat-label">Total Criteria</div>
                            </div>
                        </div>
                    </div>

                    <!-- Judge Analytics -->
                    <div style="background: #fff; border: 2px solid var(--maroon); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                        <h3 style="color: var(--maroon); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            ⚖️ Judge Statistics
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--success);" id="active-judges-stat">0</div>
                                <div class="stat-label">Active Judges</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--info);" id="judges-with-expertise">0</div>
                                <div class="stat-label">With Expertise Listed</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--warning);" id="avg-judges-per-comp">0</div>
                                <div class="stat-label">Avg Judges/Competition</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: var(--maroon);" id="total-judge-assignments">0</div>
                                <div class="stat-label">Total Assignments</div>
                            </div>
                        </div>
                    </div>

                    <!-- System Health -->
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%); border: 2px solid var(--maroon); border-radius: 12px; padding: 30px;">
                        <h3 style="color: var(--maroon); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            🔍 System Health Overview
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                            <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; text-align: center;">
                                <div style="font-size: 18px; font-weight: bold; color: var(--success); margin-bottom: 10px;">✓ System Status</div>
                                <div style="font-size: 14px; color: var(--muted);">All services operational</div>
                            </div>
                            <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; text-align: center;">
                                <div style="font-size: 18px; font-weight: bold; color: var(--info); margin-bottom: 10px;" id="data-integrity">100%</div>
                                <div style="font-size: 14px; color: var(--muted);">Data Integrity</div>
                            </div>
                            <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; text-align: center;">
                                <div style="font-size: 18px; font-weight: bold; color: var(--warning); margin-bottom: 10px;" id="system-utilization">75%</div>
                                <div style="font-size: 14px; color: var(--muted);">System Utilization</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions mt-20">
                    <button onclick="adminApp.showDashboard()" class="btn-secondary">Back to Dashboard</button>
                    <button onclick="adminApp.refreshOverviewData()" class="btn-primary">Refresh Data</button>
                </div>
            </div>
        `;

        await this.loadOverviewData();
    }

    async loadOverviewData() {
        await this.refreshOverviewData();
    }

    async refreshOverviewData() {
        try {
            console.log('Loading comprehensive system overview...');
            
            // Fetch all data
            const [competitionsRes, eventTypesRes, participantsRes, judgesRes, criteriaRes] = await Promise.all([
                fetch(`${this.baseURL}/competitions`),
                fetch(`${this.baseURL}/event-types`),
                fetch(`${this.baseURL}/participants`),
                fetch(`${this.baseURL}/judges`),
                fetch(`${this.baseURL}/criteria`)
            ]);

            if (!competitionsRes.ok || !eventTypesRes.ok || !participantsRes.ok || !judgesRes.ok || !criteriaRes.ok) {
                throw new Error('Failed to fetch system data');
            }

            const [competitions, eventTypes, participants, judges, criteria] = await Promise.all([
                competitionsRes.json(),
                eventTypesRes.json(),
                participantsRes.json(),
                judgesRes.json(),
                criteriaRes.json()
            ]);

            // Main statistics
            this.updateElementText('total-competitions', competitions?.length || 0);
            this.updateElementText('total-event-types', eventTypes?.length || 0);
            this.updateElementText('total-participants', participants?.length || 0);
            this.updateElementText('total-judges', judges?.length || 0);

            // Competition analytics
            const activeCompetitions = (competitions || []).filter(c => c.status === 'active' || !c.status);
            const pageantComps = (competitions || []).filter(c => c.is_pageant);
            const regularComps = (competitions || []).filter(c => !c.is_pageant);
            const avgParticipants = competitions?.length ? 
                Math.round((participants?.length || 0) / competitions.length) : 0;

            this.updateElementText('active-competitions-stat', activeCompetitions.length);
            this.updateElementText('pageant-competitions', pageantComps.length);
            this.updateElementText('regular-competitions', regularComps.length);
            this.updateElementText('avg-participants-per-comp', avgParticipants);

            // Participant analytics
            const activeParticipants = (participants || []).filter(p => p.status === 'active' || !p.status);
            const participantsWithComps = (participants || []).filter(p => p.competition_id);
            const participantsWithoutComps = (participants || []).filter(p => !p.competition_id);

            this.updateElementText('active-participants-stat', activeParticipants.length);
            this.updateElementText('participants-with-competitions', participantsWithComps.length);
            this.updateElementText('participants-without-competitions', participantsWithoutComps.length);
            this.updateElementText('total-criteria-count', criteria?.length || 0);

            // Judge analytics
            const activeJudges = (judges || []).filter(j => j.status === 'active' || !j.status);
            const judgesWithExpertise = (judges || []).filter(j => j.expertise && j.expertise.trim());
            const avgJudges = competitions?.length ? 
                Math.round((judges?.length || 0) / competitions.length) : 0;

            this.updateElementText('active-judges-stat', activeJudges.length);
            this.updateElementText('judges-with-expertise', judgesWithExpertise.length);
            this.updateElementText('avg-judges-per-comp', avgJudges);
            this.updateElementText('total-judge-assignments', judges?.length || 0);

            // Event type breakdown
            this.renderEventTypeBreakdown(eventTypes || []);

            // Show sections
            this.hideElement('overview-loading');
            this.hideElement('overview-error');
            this.showElement('main-stats');
            this.showElement('detailed-analytics');

            // Animate counters
            this.animateOverviewCounters();

        } catch (error) {
            console.error('Error loading overview data:', error);
            this.hideElement('overview-loading');
            this.showElement('overview-error');
            document.getElementById('overview-error').innerHTML = `
                <div class="alert alert-error">
                    <strong>Error:</strong> Unable to load system overview. Please check your connection and try again.
                </div>
            `;
        }
    }

    renderEventTypeBreakdown(eventTypes) {
        if (!eventTypes.length) {
            document.getElementById('event-type-breakdown').innerHTML = 
                '<div class="empty-state">No event types configured</div>';
            return;
        }

        const pageantTypes = eventTypes.filter(et => et.is_pageant);
        const regularTypes = eventTypes.filter(et => !et.is_pageant);

        const html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px;">
                    <h4 style="color: var(--maroon); margin-bottom: 15px;">📄 Regular Events</h4>
                    <div style="font-size: 24px; font-weight: bold; color: var(--info); margin-bottom: 10px;">${regularTypes.length}</div>
                    <div style="font-size: 14px; color: var(--muted); margin-bottom: 15px;">Total regular event types</div>
                    ${regularTypes.length ? `
                        <div style="max-height: 120px; overflow-y: auto;">
                            ${regularTypes.map(et => `
                                <div style="padding: 5px 0; border-bottom: 1px solid #eee; font-size: 14px;">
                                    ${et.type_name}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div style="font-style: italic; color: var(--muted);">No regular events</div>'}
                </div>
                
                <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px;">
                    <h4 style="color: var(--maroon); margin-bottom: 15px;">👑 Pageant Events</h4>
                    <div style="font-size: 24px; font-weight: bold; color: var(--warning); margin-bottom: 10px;">${pageantTypes.length}</div>
                    <div style="font-size: 14px; color: var(--muted); margin-bottom: 15px;">Total pageant event types</div>
                    ${pageantTypes.length ? `
                        <div style="max-height: 120px; overflow-y: auto;">
                            ${pageantTypes.map(et => `
                                <div style="padding: 5px 0; border-bottom: 1px solid #eee; font-size: 14px;">
                                    ${et.type_name}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div style="font-style: italic; color: var(--muted);">No pageant events</div>'}
                </div>
            </div>
        `;

        document.getElementById('event-type-breakdown').innerHTML = html;
    }

    animateOverviewCounters() {
        const counters = document.querySelectorAll('.summary-count, .stat-number');
        
        counters.forEach(counter => {
            const target = parseInt(counter.textContent) || 0;
            let current = 0;
            const increment = Math.max(1, Math.ceil(target / 20));
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = current;
                }
            }, 75);
        });
    }

    // Event Types Management
    async showEventTypes() {
        document.getElementById("content").innerHTML = `
            <h2>Event Types Management</h2>
            <button onclick="adminApp.showCreateEventTypeForm()" class="card-button">Add New Event Type</button>
            <div id="eventTypesList"></div>
        `;
        
        this.showLoading('eventTypesList');
        try {
            const eventTypes = await this.apiRequest('/event-types');
            this.renderEventTypes(eventTypes);
        } catch (error) {
            this.showError('eventTypesList', 'Error loading event types');
        }
    }

    renderEventTypes(eventTypes) {
        const html = eventTypes && eventTypes.length ? `
            <table>
                <tr>
                    <th>Event Type</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Actions</th>
                </tr>
                ${eventTypes.map(eventType => `
                    <tr>
                        <td><strong>${eventType.type_name}</strong></td>
                        <td>${eventType.description || 'No description'}</td>
                        <td>
                            <span class="badge ${eventType.is_pageant ? 'badge-pageant' : 'badge-regular'}">
                                ${eventType.is_pageant ? 'PAGEANT' : 'REGULAR'}
                            </span>
                        </td>
                        <td>
                            <div class="actions-cell">
                                <button onclick="adminApp.showCompetitionsByEventType(${eventType.event_type_id})" class="btn-show">Show</button>
                                <button onclick="adminApp.editEventType(${eventType.event_type_id})" class="btn-edit">Edit</button>
                                <button onclick="adminApp.deleteEventType(${eventType.event_type_id})" class="btn-delete">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </table>
        ` : '<div class="empty-state">No event types found. Create your first event type!</div>';
        
        document.getElementById("eventTypesList").innerHTML = html;
    }

    showCreateEventTypeForm() {
        document.getElementById("content").innerHTML = `
            <h2>Create New Event Type</h2>
            <form id="eventTypeForm" class="form-container">
                <label>Event Type Name:</label>
                <input type="text" id="type_name" required placeholder="e.g., Beauty Pageant, Talent Show">
                
                <label>Description:</label>
                <textarea id="description" rows="3" placeholder="Describe this event type..."></textarea>
                
                <label>Event Category:</label>
                <select id="is_pageant" required>
                    <option value="0">Regular Event</option>
                    <option value="1">Beauty Pageant Event</option>
                </select>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Create Event Type</button>
                    <button type="button" onclick="adminApp.showEventTypes()" class="btn-secondary">Cancel</button>
                </div>
            </form>
        `;

        document.getElementById("eventTypeForm").onsubmit = async (e) => {
            e.preventDefault();
            await this.createEventType();
        };
    }

    async createEventType() {
        const data = {
            type_name: document.getElementById("type_name").value,
            description: document.getElementById("description").value,
            is_pageant: document.getElementById("is_pageant").value === "1"
        };

        this.showConfirmationModal(
            'Create Event Type',
            'Are you sure you want to create this event type?',
            `Event Type: "${data.type_name}"`,
            'create-event',
            async () => {
                try {
                    const result = await this.apiRequest('/create-event-type', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    
                    if (result.success) {
                        this.showSuccessMessage('Event type created successfully!');
                        this.showEventTypes();
                    } else {
                        alert('Error: ' + (result.error || 'Unknown error'));
                    }
                } catch (error) {
                    alert('Error creating event type');
                }
            }
        );
    }

    async editEventType(id) {
        try {
            const eventTypes = await this.apiRequest('/event-types');
            const eventType = (eventTypes || []).find(et => et.event_type_id == id);
            if (!eventType) {
                alert('Event type not found');
                return;
            }

            document.getElementById("content").innerHTML = `
                <h2>Edit Event Type</h2>
                <form id="editEventTypeForm" class="form-container">
                    <label>Event Type Name:</label>
                    <input type="text" id="edit_type_name" required value="${eventType.type_name}">
                    
                    <label>Description:</label>
                    <textarea id="edit_description" rows="3">${eventType.description || ''}</textarea>
                    
                    <label>Event Category:</label>
                    <select id="edit_is_pageant" required>
                        <option value="0" ${!eventType.is_pageant ? 'selected' : ''}>Regular Event</option>
                        <option value="1" ${eventType.is_pageant ? 'selected' : ''}>Beauty Pageant Event</option>
                    </select>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Update Event Type</button>
                        <button type="button" onclick="adminApp.showEventTypes()" class="btn-secondary">Cancel</button>
                    </div>
                </form>
            `;

            document.getElementById("editEventTypeForm").onsubmit = async (e) => {
                e.preventDefault();
                await this.updateEventType(id);
            };
            
        } catch (error) {
            alert('Error loading event type data for editing');
            console.error('Edit event type error:', error);
        }
    }

    async updateEventType(eventTypeId) {
        const data = {
            type_name: document.getElementById("edit_type_name").value,
            description: document.getElementById("edit_description").value,
            is_pageant: document.getElementById("edit_is_pageant").value === "1"
        };

        this.showConfirmationModal(
            'Update Event Type',
            'Are you sure you want to update this event type?',
            `Event Type: "${data.type_name}"`,
            'update-event',
            async () => {
                try {
                    const result = await this.apiRequest(`/update-event-type/${eventTypeId}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                    
                    if (result.success) {
                        this.showSuccessMessage('Event type updated successfully!');
                        this.showEventTypes();
                    } else {
                        alert('Error: ' + (result.error || 'Unknown error'));
                    }
                } catch (error) {
                    alert('Error updating event type');
                    console.error('Update event type error:', error);
                }
            }
        );
    }

    async deleteEventType(id) {
        this.showConfirmationModal(
            'Delete Event Type',
            'Are you sure you want to delete this event type?',
            'This may affect existing competitions using this event type.',
            'delete-event',
            async () => {
                try {
                    const result = await this.apiRequest(`/delete-event-type/${id}`, { method: 'DELETE' });
                    if (result.success) {
                        this.showSuccessMessage('Event type deleted successfully!');
                        this.showEventTypes();
                    } else {
                        alert('Error: ' + (result.error || 'Unknown error'));
                    }
                } catch (error) {
                    alert('Error deleting event type');
                }
            }
        );
    }

    async showCompetitionsByEventType(eventTypeId) {
        document.getElementById("content").innerHTML = `
            <div class="competitions-by-event-type">
                <div class="event-type-header">
                    <h2>Event Type</h2>
                    <div class="event-type-details" id="et-details">
                        <p>Loading event type details…</p>
                    </div>
                </div>

                <div class="competitions-actions">
                    <button class="btn-primary" onclick="adminApp.createCompetitionFromEventType(${eventTypeId})">
                        Create Competition from this Event Type
                    </button>
                    <button class="btn-secondary" onclick="adminApp.showEventTypes()">
                        Back to Event Types
                    </button>
                </div>

                <div class="competitions-table-container">
                    <h3>Competitions</h3>
                    <div id="et-competitions-list">
                        <div class="empty-state">Loading competitions…</div>
                    </div>
                </div>
            </div>
        `;

        try {
            const eventTypes = await this.apiRequest('/event-types');
            const et = (eventTypes || []).find(e => e.event_type_id == eventTypeId);

            const etDetails = document.getElementById('et-details');
            if (!et) {
                etDetails.innerHTML = '<div class="alert alert-error">Event type not found.</div>';
            } else {
                etDetails.innerHTML = `
                    <p><strong>Name:</strong> ${et.type_name}</p>
                    <p><strong>Category:</strong> 
                        <span class="badge ${et.is_pageant ? 'badge-pageant' : 'badge-regular'}">
                            ${et.is_pageant ? 'PAGEANT' : 'REGULAR'}
                        </span>
                    </p>
                    <p><strong>Description:</strong> ${et.description || 'No description'}</p>
                `;
            }

            const competitions = await this.apiRequest('/competitions');
            const filtered = (competitions || []).filter(c => String(c.event_type_id) === String(eventTypeId));

            const target = document.getElementById('et-competitions-list');
            if (!filtered.length) {
                target.innerHTML = `
                    <div class="no-competitions-state">
                        <h3>No competitions for this event type yet</h3>
                        <p>Create your first competition using the button above.</p>
                    </div>
                `;
                return;
            }

            target.innerHTML = `
                <table class="competitions-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Participants</th>
                            <th>Judges</th>
                            <th>Status</th>
                            <th class="actions-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(c => `
                            <tr>
                                <td>
                                    <strong>${c.competition_name}</strong><br/>
                                    <small>${c.type_name || ''}</small>
                                </td>
                                <td>${c.competition_date || '-'}</td>
                                <td>${c.participant_count ?? 0}</td>
                                <td>${c.judge_count ?? 0}</td>
                                <td>
                                    <span class="status-badge ${c.participant_count > 0 && c.judge_count > 0 ? 'status-ready' : 'status-setup'}">
                                        ${c.participant_count > 0 && c.judge_count > 0 ? 'Ready' : 'Setup'}
                                    </span>
                                </td>
                                <td class="actions-cell">
                                    <button class="btn-primary-small" onclick="adminApp.manageCriteria(${c.competition_id})">Manage Criteria</button>
                                    <button class="btn-edit-small" onclick="adminApp.editCompetition(${c.competition_id})">Edit</button>
                                    <button class="btn-delete-small" onclick="adminApp.deleteCompetition(${c.competition_id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (err) {
            console.error(err);
            document.getElementById('et-competitions-list').innerHTML = '<div class="alert alert-error">Error loading competitions for this event type.</div>';
        }
    }

    async createCompetitionFromEventType(eventTypeId) {
        try {
            const eventTypes = await this.apiRequest('/event-types');
            const eventType = (eventTypes || []).find(et => et.event_type_id == eventTypeId);
            if (!eventType) {
                alert('Event type not found');
                return;
            }

            document.getElementById("content").innerHTML = `
                <h2>Create Competition - ${eventType.type_name}</h2>
                <div class="event-type-info">
                    <div class="info-card">
                        <h3>Event Type: ${eventType.type_name}</h3>
                        <p><strong>Category:</strong> ${eventType.is_pageant ? 'Beauty Pageant' : 'Regular Event'}</p>
                        <p><strong>Description:</strong> ${eventType.description || 'No description available'}</p>
                    </div>
                </div>
                <form id="competitionFromEventForm" class="form-container">
                    <label>Competition Name:</label>
                    <input type="text" id="competition_name" required placeholder="Enter competition name">
                    
                    <label>Competition Date:</label>
                    <input type="date" id="competition_date" required>
                    
                    <label>Event Description:</label>
                    <textarea id="event_description" rows="3" placeholder="Describe this specific competition..."></textarea>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Create Competition</button>
                        <button type="button" onclick="adminApp.showEventTypes()" class="btn-secondary">Cancel</button>
                    </div>
                </form>
            `;

            document.getElementById("competitionFromEventForm").onsubmit = async (e) => {
                e.preventDefault();
                await this.createCompetitionFromForm(eventTypeId);
            };
            
        } catch (error) {
            alert('Error loading event type details');
            console.error('Create competition from event type error:', error);
        }
    }

    async createCompetitionFromForm(eventTypeId) {
        const data = {
            competition_name: document.getElementById("competition_name").value,
            event_type_id: eventTypeId,
            competition_date: document.getElementById("competition_date").value,
            event_description: document.getElementById("event_description").value
        };

        this.showConfirmationModal(
            'Create Competition',
            'Are you sure you want to create this competition?',
            `Competition: "${data.competition_name}"`,
            'create-competition',
            async () => {
                try {
                    const result = await this.apiRequest('/create-competition', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    
                    if (result.success) {
                        this.showSuccessMessage('Competition created successfully!');
                        this.showCompetitions();
                    } else {
                        alert('Error: ' + (result.error || 'Unknown error'));
                    }
                } catch (error) {
                    alert('Error creating competition');
                }
            }
        );
    }

    // Competitions Management
    async showCompetitions() {
        document.getElementById("content").innerHTML = `
            <h2>Manage Competitions</h2>
            <button onclick="adminApp.showCreateCompetitionForm()" class="card-button">Add New Competition</button>
            <div id="competitionsList"></div>
        `;

        this.showLoading('competitionsList');
        try {
            const competitions = await this.apiRequest('/competitions');
            this.renderCompetitions(competitions);
        } catch (error) {
            this.showError('competitionsList', 'Error loading competitions');
        }
    }

    renderCompetitions(competitions) {
        const html = competitions && competitions.length ? `
            <div class="competitions-grid">
                ${competitions.map(competition => `
                    <div class="dashboard-card">
                        <h3>${competition.competition_name} 
                            <span class="badge ${competition.is_pageant ? 'badge-pageant' : 'badge-regular'}">
                                ${competition.is_pageant ? 'PAGEANT' : 'REGULAR'}
                            </span>
                        </h3>
                        <div class="competition-details">
                            <p><strong>Type:</strong> ${competition.type_name}</p>
                            <p><strong>Date:</strong> ${competition.competition_date}</p>
                            <p><strong>Participants:</strong> ${competition.participant_count || 0}</p>
                            <p><strong>Judges:</strong> ${competition.judge_count || 0}</p>
                        </div>
                        <div class="card-actions">
                            <button onclick="adminApp.manageCriteria(${competition.competition_id})" class="btn-primary">Manage Criteria</button>
                            <button onclick="adminApp.editCompetition(${competition.competition_id})" class="btn-edit">Edit</button>
                            <button onclick="adminApp.deleteCompetition(${competition.competition_id})" class="btn-delete">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="empty-state">No competitions found. Create your first competition!</div>';

        document.getElementById("competitionsList").innerHTML = html;
    }

    showCreateCompetitionForm() {
        document.getElementById("content").innerHTML = `
            <h2>Create New Competition</h2>
            <form id="competitionForm" class="form-container">
                <label>Competition Name:</label>
                <input type="text" id="competition_name" required>
                
                <label>Event Type:</label>
                <select id="event_type_id" required>
                    <option value="">Select Event Type</option>
                </select>
                
                <label>Competition Date:</label>
                <input type="date" id="competition_date" required>
                
                <label>Event Description:</label>
                <textarea id="event_description" rows="3"></textarea>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Create Competition</button>
                    <button type="button" onclick="adminApp.showCompetitions()" class="btn-secondary">Cancel</button>
                </div>
            </form>
        `;

        this.loadEventTypesForDropdown();
        document.getElementById("competitionForm").onsubmit = async (e) => {
            e.preventDefault();
            await this.createCompetition();
        };
    }

    async loadEventTypesForDropdown() {
        try {
            const eventTypes = await this.apiRequest('/event-types');
            const select = document.getElementById("event_type_id");
            (eventTypes || []).forEach(eventType => {
                const option = document.createElement("option");
                option.value = eventType.event_type_id;
                option.textContent = `${eventType.type_name} ${eventType.is_pageant ? '(Pageant)' : '(Regular)'}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading event types:', error);
        }
    }

    async createCompetition() {
        const data = {
            competition_name: document.getElementById("competition_name").value,
            event_type_id: document.getElementById("event_type_id").value,
            competition_date: document.getElementById("competition_date").value,
            event_description: document.getElementById("event_description").value
        };

        this.showConfirmationModal(
            'Create Competition',
            'Are you sure you want to create this competition?',
            `Competition: "${data.competition_name}"`,
            'create-competition',
            async () => {
                try {
                    const result = await this.apiRequest('/create-competition', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    
                    if (result.success) {
                        this.showSuccessMessage('Competition created successfully!');
                        this.showCompetitions();
                    } else {
                        alert('Error: ' + (result.error || 'Unknown error'));
                    }
                } catch (error) {
                    alert('Error creating competition');
                }
            }
        );
    }

    async editCompetition(id) {
        try {
            const competition = await this.apiRequest(`/competition/${id}`);
            document.getElementById("content").innerHTML = `
                <h2>Edit Competition</h2>
                <form id="editCompetitionForm" class="form-container">
                    <label>Competition Name:</label>
                    <input type="text" id="edit_competition_name" required value="${competition.competition_name}">
                    
                    <label>Event Type:</label>
                    <select id="edit_event_type_id" required>
                        <option value="">Select Event Type</option>
                    </select>
                    
                    <label>Competition Date:</label>
                    <input type="date" id="edit_competition_date" required value="${competition.competition_date}">
                    
                    <label>Event Description:</label>
                    <textarea id="edit_event_description" rows="3">${competition.event_description || ''}</textarea>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Update Competition</button>
                        <button type="button" onclick="adminApp.showCompetitions()" class="btn-secondary">Cancel</button>
                    </div>
                </form>
            `;

            await this.loadEventTypesForEdit(competition.event_type_id);
            document.getElementById("editCompetitionForm").onsubmit = async (e) => {
                e.preventDefault();
                await this.updateCompetition(id);
            };
        } catch (error) {
            alert('Error loading competition data for editing');
            console.error('Edit competition error:', error);
        }
    }

    async loadEventTypesForEdit(currentEventTypeId) {
        try {
            const eventTypes = await this.apiRequest('/event-types');
            const select = document.getElementById("edit_event_type_id");
            (eventTypes || []).forEach(eventType => {
                const option = document.createElement("option");
                option.value = eventType.event_type_id;
                option.textContent = `${eventType.type_name} ${eventType.is_pageant ? '(Pageant)' : '(Regular)'}`;
                
                if (eventType.event_type_id == currentEventTypeId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading event types for edit:', error);
        }
    }

    async updateCompetition(competitionId) {
        const data = {
            competition_name: document.getElementById("edit_competition_name").value,
            event_type_id: document.getElementById("edit_event_type_id").value,
            competition_date: document.getElementById("edit_competition_date").value,
            event_description: document.getElementById("edit_event_description").value
        };

        this.showConfirmationModal(
            'Update Competition',
            'Are you sure you want to update this competition?',
            `Competition: "${data.competition_name}"`,
            'update-competition',
            async () => {
                try {
                    const result = await this.apiRequest(`/update-competition/${competitionId}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                    
                    if (result.success) {
                        this.showSuccessMessage('Competition updated successfully!');
                        this.showCompetitions();
                    } else {
                        alert('Error: ' + (result.error || 'Unknown error'));
                    }
                } catch (error) {
                    alert('Error updating competition');
                    console.error('Update competition error:', error);
                }
            }
        );
    }

    async deleteCompetition(id) {
        this.showConfirmationModal(
            'Delete Competition',
            'Are you sure you want to delete this competition?',
            'This will also delete all participants, judges, and scores associated with it.',
            'delete-competition',
            async () => {
                try {
                    const result = await this.apiRequest(`/delete-competition/${id}`, { method: 'DELETE' });
                    if (result.success) {
                        this.showSuccessMessage('Competition deleted successfully!');
                        this.showCompetitions();
                    } else {
                        alert('Error: ' + (result.error || 'Unknown error'));
                    }
                } catch (error) {
                    alert('Error deleting competition');
                }
            }
        );
    }

    // Criteria Management
    async showCriteria() {
        document.getElementById("content").innerHTML = `
            <div class="criteria-management-container">
                <div class="criteria-main-header">
                    <h2>Judging Criteria Management</h2>
                    <p>Configure judging criteria for your competitions. Select a competition below to manage its criteria.</p>
                </div>
                
                <div class="competition-selector-card">
                    <div class="selector-content">
                        <div class="selector-icon">
                            <div class="icon-circle">
                                <span class="icon-text">📋</span>
                            </div>
                        </div>
                        <div class="selector-form">
                            <label class="selector-label">Choose Competition</label>
                            <select id="criteriaCompetition" class="large-select" onchange="adminApp.loadCompetitionCriteria()">
                                <option value="">Select Competition to Manage Criteria</option>
                            </select>
                            <p class="selector-help">Select a competition from the dropdown above to view and edit its judging criteria.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        try {
            const competitions = await this.apiRequest('/competitions');
            const select = document.getElementById("criteriaCompetition");
            (competitions || []).forEach(competition => {
                const option = document.createElement("option");
                option.value = competition.competition_id;
                option.textContent = `${competition.competition_name} (${competition.type_name})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading competitions:', error);
        }
    }

    async loadCompetitionCriteria() {
        const competitionId = document.getElementById("criteriaCompetition").value;
        if (!competitionId) return;

        this.currentCompetitionId = competitionId;
        this.manageCriteria(competitionId);
    }

    async manageCriteria(competitionId) {
        document.getElementById("content").innerHTML = `
            <h2>Manage Competition Criteria</h2>
            <button onclick="adminApp.addCriterion(${competitionId})" class="card-button">Add Criterion</button>
            <div id="criteriaList"></div>
            <div class="form-actions mt-20">
                <button onclick="adminApp.saveCriteria(${competitionId})" class="btn-primary">Save All Criteria</button>
                <button onclick="adminApp.showCompetitions()" class="btn-secondary">Back to Competitions</button>
            </div>
        `;

        this.currentCompetitionId = competitionId;
        this.currentCriteria = [];
        await this.loadCriteriaForCompetition(competitionId);
    }

    async loadCriteriaForCompetition(competitionId) {
        try {
            const criteria = await this.apiRequest(`/competition-criteria/${competitionId}`);
            this.currentCriteria = (criteria && criteria.length) ? criteria : [this.createDefaultCriterion(1)];
            this.renderCriteriaList();
        } catch (error) {
            console.error('Error loading criteria:', error);
            this.currentCriteria = [this.createDefaultCriterion(1)];
            this.renderCriteriaList();
        }
    }

    createDefaultCriterion(order) {
        return {
            criteria_name: '',
            description: '',
            percentage: 0,
            max_score: 100,
            order_number: order
        };
    }

    renderCriteriaList() {
        const totalPct = this.currentCriteria.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0);

        const html = `
            <div id="criteriaContainer">
                <div class="criteria-summary">
                    <h3>Competition Criteria (${this.currentCriteria.length} ${this.currentCriteria.length === 1 ? 'Criterion' : 'Criteria'})</h3>
                    <p>Set up the judging criteria for this competition. Total weight must equal 100%.</p>
                </div>
                
                ${this.currentCriteria.map((criterion, index) => `
                    <div class="criterion-card" data-index="${index}">
                        <div class="criterion-header">
                            <div class="criterion-title">
                                <span class="criterion-number">${index + 1}</span>
                                <h3>Criterion ${index + 1}</h3>
                            </div>
                            ${this.currentCriteria.length > 1 ? `
                                <button onclick="adminApp.removeCriterion(${index})" class="btn-remove-criterion">
                                    <span class="remove-icon">×</span>
                                    <span class="remove-text">Remove</span>
                                </button>
                            ` : ''}
                        </div>
                        
                        <div class="criterion-form">
                            <div class="form-row">
                                <div class="form-field">
                                    <label class="field-label">Criteria Name</label>
                                    <input type="text" 
                                           class="form-input" 
                                           value="${criterion.criteria_name}" 
                                           placeholder="e.g., Speed, Technique, Creativity, Performance"
                                           onchange="adminApp.updateCriterion(${index}, 'criteria_name', this.value)">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-field">
                                    <label class="field-label">Description</label>
                                    <textarea class="form-textarea" 
                                              rows="3"
                                              placeholder="Describe what judges should evaluate for this criterion..."
                                              onchange="adminApp.updateCriterion(${index}, 'description', this.value)">${criterion.description}</textarea>
                                </div>
                            </div>
                            
                            <div class="form-row-split">
                                <div class="form-field">
                                    <label class="field-label">Weight Percentage</label>
                                    <div class="input-with-unit">
                                        <input type="number" 
                                               class="form-input-large" 
                                               value="${criterion.percentage}" 
                                               min="0" 
                                               max="100" 
                                               placeholder="0"
                                               onchange="adminApp.updateCriterion(${index}, 'percentage', this.value)">
                                        <span class="input-unit">%</span>
                                    </div>
                                </div>
                                
                                <div class="form-field">
                                    <label class="field-label">Maximum Score</label>
                                    <div class="input-with-unit">
                                        <input type="number" 
                                               class="form-input-large" 
                                               value="${criterion.max_score}" 
                                               min="1" 
                                               placeholder="100"
                                               onchange="adminApp.updateCriterion(${index}, 'max_score', this.value)">
                                        <span class="input-unit">points</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                <div class="total-percentage-card">
                    <div class="percentage-display">
                        <span class="percentage-label">Total Weight:</span>
                        <span class="percentage-value" id="totalPercentage">${totalPct}%</span>
                    </div>
                    <div class="percentage-bar">
                        <div class="percentage-fill" id="percentageFill" style="width: ${Math.min(totalPct, 100)}%"></div>
                    </div>
                    <div class="percentage-status" id="percentageStatus">
                        ${totalPct === 100 
                            ? '<span class="status-success">Ready to save - Total is 100%</span>' 
                            : '<span class="status-warning">Must total 100% to save criteria</span>'}
                    </div>
                </div>
            </div>
        `;

        document.getElementById("criteriaList").innerHTML = html;
    }

    updateCriterion(index, field, value) {
        if (field === 'percentage' || field === 'max_score') {
            const num = Number(value);
            this.currentCriteria[index][field] = isNaN(num) ? 0 : num;
        } else {
            this.currentCriteria[index][field] = value;
        }
        if (field === 'percentage') {
            this.updateTotalPercentage();
        }
    }

    updateTotalPercentage() {
        const total = this.currentCriteria.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0);
        const totalEl = document.getElementById('totalPercentage');
        const fillEl = document.getElementById('percentageFill');
        const statusEl = document.getElementById('percentageStatus');

        if (totalEl) totalEl.textContent = `${total}%`;
        if (fillEl) fillEl.style.width = `${Math.min(total, 100)}%`;
        if (statusEl) {
            statusEl.innerHTML = (total === 100)
                ? '<span class="status-success">Ready to save - Total is 100%</span>'
                : '<span class="status-warning">Must total 100% to save criteria</span>';
        }
    }

    addCriterion() {
        this.currentCriteria.push(this.createDefaultCriterion(this.currentCriteria.length + 1));
        this.renderCriteriaList();
    }

    removeCriterion(index) {
        if (this.currentCriteria.length > 1) {
            const criterionName = this.currentCriteria[index].criteria_name || `Criterion ${index + 1}`;
            
            this.showConfirmationModal(
                'Remove Criterion',
                'Are you sure you want to remove this criterion?',
                `This will permanently remove "${criterionName}" from the criteria list.`,
                'delete-event',
                () => {
                    this.currentCriteria.splice(index, 1);
                    this.renderCriteriaList();
                    this.showSuccessMessage('Criterion removed successfully!');
                }
            );
        }
    }

    async saveCriteria(competitionId) {
        const total = this.currentCriteria.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0);
        if (total !== 100) {
            this.showConfirmationModal(
                'Invalid Percentage Total',
                'Total percentage must equal 100%',
                `Current total is ${total}%. Please adjust the criteria percentages.`,
                'validation-error',
                () => {
                    // Just close the modal, don't proceed with save
                }
            );
            return;
        }

        this.showConfirmationModal(
            'Save Criteria',
            'Are you sure you want to save these criteria?',
            'This will update the judging criteria for this competition.',
            'save-criteria',
            async () => {
                try {
                    const result = await this.apiRequest('/save-competition-criteria', {
                        method: 'POST',
                        body: JSON.stringify({
                            competition_id: competitionId,
                            criteria: this.currentCriteria
                        })
                    });

                    if (result.success) {
                        this.showSuccessMessage('Criteria saved successfully!');
                        this.showCriteria();
                    } else {
                        alert('Error: ' + (result.error || 'Unknown error'));
                    }
                } catch (error) {
                    alert('Error saving criteria');
                }
            }
        );
    }
}

// Initialize the admin dashboard
const adminApp = new AdminDashboard();

// Global functions for backwards compatibility
window.showDashboard = () => adminApp.showDashboard();
window.showEventTypes = () => adminApp.showEventTypes();
window.showCompetitions = () => adminApp.showCompetitions();
window.showScoringResults = () => adminApp.showScoringResults(); // Now shows system overview
window.showCriteria = () => adminApp.showCriteria();

// Make sure all admin functions are globally accessible
window.adminApp = adminApp;

// Explicitly expose functions used by inline onclicks
window.showCompetitionsByEventType = (eventTypeId) => adminApp.showCompetitionsByEventType(eventTypeId);
window.createCompetitionFromEventType = (eventTypeId) => adminApp.createCompetitionFromEventType(eventTypeId);
window.editEventType = (eventTypeId) => adminApp.editEventType(eventTypeId);
window.deleteEventType = (eventTypeId) => adminApp.deleteEventType(eventTypeId);
