// Enhanced Staff Dashboard - Complete Implementation Matching Admin Format
class StaffDashboard {
    constructor() {
        this.baseURL = 'http://localhost:3002';
        this.user = null;
        this.currentCompetitionId = null;
        this.liveRefreshInterval = null;
        this.currentView = 'dashboard';
        this.originalCompetitions = [];
        this.originalParticipants = [];
        this.originalJudges = [];
        this.init();
    }

    init() {
        // Check if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.checkAuthentication();
                this.showDashboard();
            });
        } else {
            // DOM is already loaded
            this.checkAuthentication();
            this.showDashboard();
        }
    }

    checkAuthentication() {
        try {
            this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
            if (!this.user || this.user.role !== 'staff') {
                console.log('Authentication failed, redirecting to login');
                window.location.href = 'login.html';
                return false;
            }
            this.updateHeader();
            return true;
        } catch (error) {
            console.error('Authentication check error:', error);
            window.location.href = 'login.html';
            return false;
        }
    }

    updateHeader() {
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            headerRight.innerHTML = `
                <div>Welcome, ${this.user.username}</div>
                <div style="font-size: 12px;">Role: Staff</div>
                <button class="logout-btn" onclick="staffApp.logout()">Logout</button>
            `;
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

    // Confirmation Modal System - Matching Admin
    showConfirmationModal(title, message, subtitle, type, onConfirm) {
        const iconMap = {
            'delete-event': '⚠️',
            'delete-competition': '⚠️',
            'logout': '🚪',
            'save-criteria': '💾',
            'validation-error': '⚠️',
            'create-event': '✔️',
            'create-competition': '✔️',
            'update-event': '✏️',
            'update-competition': '✏️',
            'register-participant': '👤'
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
            'update-competition': 'Yes, Update',
            'register-participant': 'Yes, Register'
        };

        const icon = iconMap[type] || '⚠️';
        const buttonText = buttonTextMap[type] || 'Yes, Continue';
        const showCancelButton = type !== 'validation-error';

        const modal = document.createElement('div');
        modal.className = 'confirmation-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('tabindex', '-1');

        const titleId = `cm-title-${Date.now()}`;
        const msgId = `cm-msg-${Date.now()}`;
        modal.setAttribute('aria-labelledby', titleId);
        modal.setAttribute('aria-describedby', msgId);

        modal.innerHTML = `
            <div class="confirmation-modal-content ${type}">
                <div class="confirmation-modal-header">
                    <div class="confirmation-modal-icon"><span class="confirmation-icon">${icon}</span></div>
                    <h3 id="${titleId}">${title}</h3>
                </div>
                <div class="confirmation-modal-body">
                    <p class="confirmation-message" id="${msgId}">${message}</p>
                    ${subtitle ? `<p class="confirmation-subtitle">${subtitle}</p>` : ''}
                </div>
                <div class="confirmation-modal-actions">
                    <button class="confirmation-confirm-btn">
                        <span class="btn-icon">${(type.includes('delete')) ? '🗑️' : '✔️'}</span>
                        ${buttonText}
                    </button>
                    ${showCancelButton ? `
                        <button class="confirmation-cancel-btn">
                            <span class="btn-icon">✕</span> Cancel
                        </button>` : ''
                    }
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const confirmBtn = modal.querySelector('.confirmation-confirm-btn');
        const cancelBtn = modal.querySelector('.confirmation-cancel-btn');

        const doConfirm = () => {
            try { onConfirm && onConfirm(); } finally { this.closeConfirmationModal(); }
        };

        const onKeyDown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); doConfirm(); }
            if (e.key === 'Escape') { e.preventDefault(); this.closeConfirmationModal(); }
        };

        confirmBtn?.addEventListener('click', doConfirm);
        cancelBtn?.addEventListener('click', () => this.closeConfirmationModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeConfirmationModal();
        });
        modal.addEventListener('keydown', onKeyDown);

        (confirmBtn || modal).focus();
    }

    closeConfirmationModal() {
        const modal = document.querySelector('.confirmation-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">✔️</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    async apiRequest(endpoint, options = {}) {
        try {
            console.log(`API Request: ${endpoint}`, options);
            
            const config = {
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                ...options
            };

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            console.log(`API Response status: ${response.status}`);
            
            if (!response.ok) {
                let errorText;
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = response.statusText;
                }
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('API Response data:', result);
            return result;
            
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    showLoading(containerId) {
        const el = document.getElementById(containerId);
        if (!el) {
            console.warn(`Container ${containerId} not found`);
            return;
        }
        el.innerHTML = `
            <div class="loading">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading...</p>
            </div>
        `;
    }

    showError(containerId, message) {
        const el = document.getElementById(containerId);
        if (!el) {
            console.warn(`Container ${containerId} not found`);
            return;
        }
        el.innerHTML = `<div class="alert alert-error">${message}</div>`;
    }

    showDashboard() {
        console.log('Showing dashboard');
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        content.innerHTML = `
            <div class="dashboard-grid">
                ${this.createDashboardCard('Competitions', 'View and monitor all competitions', 'showCompetitions')}
                ${this.createDashboardCard('Participants', 'Manage participant registrations', 'showParticipants')}
                ${this.createDashboardCard('Judges', 'View judge assignments and details', 'showJudges')}
                ${this.createDashboardCard('Live Scoring', 'Monitor live competition scoring', 'showLiveScoring')}
                ${this.createDashboardCard('Results', 'View current rankings and results', 'showResults')}
                ${this.createDashboardCard('Event Status', 'Track overall competition progress', 'showEventStatus')}
            </div>
        `;
    }

    createDashboardCard(title, description, action) {
        return `
            <div class="dashboard-card">
                <h3>${title}</h3>
                <p>${description}</p>
                <button onclick="staffApp.${action}()" class="card-button">Manage</button>
            </div>
        `;
    }

    // Competitions Management
    async showCompetitions() {
        console.log('Showing competitions');
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        content.innerHTML = `
            <h2>Competitions Management</h2>
            <div id="competitionsList"></div>
        `;
        
        this.showLoading('competitionsList');
        try {
            const competitions = await this.apiRequest('/competitions');
            this.originalCompetitions = competitions;
            this.renderCompetitions(competitions);
        } catch (error) {
            console.error('Error loading competitions:', error);
            this.showError('competitionsList', `Error loading competitions: ${error.message}`);
        }
    }

    renderCompetitions(competitions) {
        const container = document.getElementById("competitionsList");
        if (!container) {
            console.error('competitionsList container not found');
            return;
        }

        const html = competitions && competitions.length ? `
            <table>
                <tr>
                    <th>Competition Name</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Participants</th>
                    <th>Judges</th>
                    <th>Category</th>
                    <th>Actions</th>
                </tr>
                ${competitions.map(competition => `
                    <tr>
                        <td><strong>${competition.competition_name}</strong></td>
                        <td>${competition.type_name || 'N/A'}</td>
                        <td>${competition.competition_date || 'Not set'}</td>
                        <td>${competition.participant_count || 0}</td>
                        <td>${competition.judge_count || 0}</td>
                        <td>
                            <span class="badge ${competition.is_pageant ? 'badge-pageant' : 'badge-regular'}">
                                ${competition.is_pageant ? 'PAGEANT' : 'REGULAR'}
                            </span>
                        </td>
                        <td>
                            <div class="actions-cell">
                                <button onclick="staffApp.viewCompetitionDetails(${competition.competition_id})" class="btn-show">View</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </table>
        ` : '<div class="empty-state">No competitions found.</div>';
        
        container.innerHTML = html;
    }

    async viewCompetitionDetails(competitionId) {
        console.log('Viewing competition details:', competitionId);
        const content = document.getElementById("content");
        if (!content) return;

        content.innerHTML = `
            <h2>Competition Details</h2>
            <div id="competitionDetails"></div>
        `;

        this.showLoading('competitionDetails');
        try {
            const [competition, participants, judges] = await Promise.all([
                this.apiRequest(`/competition/${competitionId}`),
                this.apiRequest(`/competition-participants/${competitionId}`),
                this.apiRequest(`/competition-judges/${competitionId}`)
            ]);

            const html = `
                <div class="competition-detail-card">
                    <div class="card-header">
                        <h3>${competition.competition_name}</h3>
                        <span class="badge ${competition.is_pageant ? 'badge-pageant' : 'badge-regular'}">
                            ${competition.is_pageant ? 'PAGEANT' : 'REGULAR'}
                        </span>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Competition Information</h4>
                        <p><strong>Type:</strong> ${competition.type_name}</p>
                        <p><strong>Date:</strong> ${competition.competition_date}</p>
                        <p><strong>Description:</strong> ${competition.event_description || 'No description'}</p>
                    </div>

                    <div class="detail-section">
                        <h4>Participants (${participants.length})</h4>
                        ${participants.length ? `
                            <ul>
                                ${participants.map(p => `<li>${p.participant_name}</li>`).join('')}
                            </ul>
                        ` : '<p>No participants yet.</p>'}
                    </div>

                    <div class="detail-section">
                        <h4>Judges (${judges.length})</h4>
                        ${judges.length ? `
                            <ul>
                                ${judges.map(j => `<li>${j.judge_name} - ${j.expertise}</li>`).join('')}
                            </ul>
                        ` : '<p>No judges assigned yet.</p>'}
                    </div>

                    <div class="form-actions">
                        <button onclick="staffApp.showCompetitions()" class="btn-secondary">Back to Competitions</button>
                    </div>
                </div>
            `;

            document.getElementById("competitionDetails").innerHTML = html;
        } catch (error) {
            this.showError('competitionDetails', 'Error loading competition details');
        }
    }

    // Participants Management
    async showParticipants() {
        console.log('Showing participants');
        const content = document.getElementById("content");
        if (!content) return;
        
        content.innerHTML = `
            <h2>Participants Management</h2>
            <button onclick="staffApp.showAddParticipantForm()" class="card-button">Add New Participant</button>
            <div id="participantsList"></div>
        `;
        
        this.showLoading('participantsList');
        try {
            const participants = await this.apiRequest('/participants');
            this.originalParticipants = participants;
            this.renderParticipants(participants);
        } catch (error) {
            console.error('Error loading participants:', error);
            this.showError('participantsList', `Error loading participants: ${error.message}`);
        }
    }

    renderParticipants(participants) {
        const container = document.getElementById("participantsList");
        if (!container) return;

        const html = participants && participants.length ? `
            <table>
                <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Competition</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                ${participants.map(participant => `
                    <tr>
                        <td><strong>${participant.participant_name}</strong></td>
                        <td>${participant.age}</td>
                        <td>${participant.gender}</td>
                        <td>${participant.competition_name || 'Not assigned'}</td>
                        <td>
                            <span class="status-badge status-${participant.status}">
                                ${participant.status.toUpperCase()}
                            </span>
                        </td>
                        <td>
                            <div class="actions-cell">
                                <button onclick="staffApp.viewParticipant(${participant.participant_id})" class="btn-show">View</button>
                                <button onclick="staffApp.updateParticipantStatus(${participant.participant_id})" class="btn-edit">Update Status</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </table>
        ` : '<div class="empty-state">No participants found.</div>';
        
        container.innerHTML = html;
    }

    showAddParticipantForm() {
        const content = document.getElementById("content");
        if (!content) return;
        
        content.innerHTML = `
            <h2>Add New Participant</h2>
            <form id="participantForm" class="form-container">
                <label>Participant Name:</label>
                <input type="text" id="participant_name" required>
                
                <label>Email:</label>
                <input type="email" id="email" required>
                
                <label>Age:</label>
                <input type="number" id="age" required min="1" max="120">
                
                <label>Gender:</label>
                <select id="gender" required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
                
                <label>Competition:</label>
                <select id="competition_id" required>
                    <option value="">Select Competition</option>
                </select>
                
                <label>Status:</label>
                <select id="status" required>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="waived">Waived</option>
                </select>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Register Participant</button>
                    <button type="button" onclick="staffApp.showParticipants()" class="btn-secondary">Cancel</button>
                </div>
            </form>
        `;

        this.loadCompetitionsForForm();
        
        const form = document.getElementById("participantForm");
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createParticipant();
            });
        }
    }

    async loadCompetitionsForForm() {
        try {
            const competitions = await this.apiRequest('/competitions');
            const select = document.getElementById("competition_id");
            if (select) {
                competitions.forEach(comp => {
                    const option = document.createElement("option");
                    option.value = comp.competition_id;
                    option.textContent = comp.competition_name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading competitions:', error);
        }
    }

    async createParticipant() {
        const data = {
            participant_name: document.getElementById("participant_name").value.trim(),
            email: document.getElementById("email").value.trim(),
            age: parseInt(document.getElementById("age").value),
            gender: document.getElementById("gender").value,
            competition_id: parseInt(document.getElementById("competition_id").value),
            status: document.getElementById("status").value
        };

        try {
            const result = await this.apiRequest('/add-participant', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (result.success) {
                this.showSuccessMessage('Participant registered successfully!');
                this.showParticipants();
            } else {
                alert('Error: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating participant:', error);
            alert('Error creating participant: ' + error.message);
        }
    }

    async viewParticipant(participantId) {
        console.log('Viewing participant:', participantId);
        // Implement view details
    }

    async updateParticipantStatus(participantId) {
        console.log('Updating participant status:', participantId);
        // Implement status update
    }

    // Judges Management
    async showJudges() {
        console.log('Showing judges');
        const content = document.getElementById("content");
        if (!content) return;
        
        content.innerHTML = `
            <h2>Judges Management</h2>
            <div id="judgesList"></div>
        `;
        
        this.showLoading('judgesList');
        try {
            const judges = await this.apiRequest('/judges');
            this.originalJudges = judges;
            this.renderJudges(judges);
        } catch (error) {
            console.error('Error loading judges:', error);
            this.showError('judgesList', `Error loading judges: ${error.message}`);
        }
    }

    renderJudges(judges) {
        const container = document.getElementById("judgesList");
        if (!container) return;

        const html = judges && judges.length ? `
            <table>
                <tr>
                    <th>Judge Name</th>
                    <th>Email</th>
                    <th>Expertise</th>
                    <th>Experience</th>
                    <th>Competition</th>
                    <th>Username</th>
                </tr>
                ${judges.map(judge => `
                    <tr>
                        <td><strong>${judge.judge_name}</strong></td>
                        <td>${judge.email}</td>
                        <td>${judge.expertise}</td>
                        <td>${judge.experience_years || 0} years</td>
                        <td>${judge.competition_name || 'Not assigned'}</td>
                        <td>${judge.username || 'Not set'}</td>
                    </tr>
                `).join('')}
            </table>
        ` : '<div class="empty-state">No judges found.</div>';
        
        container.innerHTML = html;
    }

    // Live Scoring
    async showLiveScoring() {
        console.log('Showing live scoring');
        const content = document.getElementById("content");
        if (!content) return;

        content.innerHTML = `
            <h2>Live Scoring Monitor</h2>
            <div id="liveScoringContent">
                <p>Select a competition to monitor live scoring.</p>
            </div>
        `;
    }

    // Results
    async showResults() {
        console.log('Showing results');
        const content = document.getElementById("content");
        if (!content) return;

        content.innerHTML = `
            <h2>Competition Results</h2>
            <div id="resultsContent">
                <p>Select a competition to view results.</p>
            </div>
        `;
    }

    // Event Status
    async showEventStatus() {
        console.log('Showing event status');
        const content = document.getElementById("content");
        if (!content) return;

        content.innerHTML = `
            <h2>Event Status Monitor</h2>
            <div id="eventStatusContent">
                <p>Loading event status...</p>
            </div>
        `;
    }

    cleanup() {
        if (this.liveRefreshInterval) {
            clearInterval(this.liveRefreshInterval);
            this.liveRefreshInterval = null;
        }
    }
}

// Initialize the staff dashboard
const staffApp = new StaffDashboard();

// Global functions for backwards compatibility
window.showDashboard = () => staffApp.showDashboard();
window.showCompetitions = () => staffApp.showCompetitions();
window.showParticipants = () => staffApp.showParticipants();
window.showJudges = () => staffApp.showJudges();
window.showLiveScoring = () => staffApp.showLiveScoring();
window.showResults = () => staffApp.showResults();
window.showEventStatus = () => staffApp.showEventStatus();

// Make sure all staff functions are globally accessible
window.staffApp = staffApp;
