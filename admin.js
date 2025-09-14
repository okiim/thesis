// Enhanced Admin Dashboard - Modified Implementation
class AdminDashboard {
    constructor() {
        this.baseURL = 'http://localhost:3002';
        this.user = null;
        this.init();
    }

    // Initialize the application
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthentication();
            this.showDashboard();
        });
    }

    // Authentication methods
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
                <div>Welcome, ${this.user.username}</div>
                <div style="font-size: 12px;">Role: Administrator</div>
                <button onclick="adminApp.logout()" class="logout-btn">Logout</button>
            `;
        }
    }

    logout() {
        sessionStorage.removeUser('user');
        window.location.href = 'login.html';
    }

    // Utility methods
    async apiRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: { 'Content-Type': 'application/json' },
                ...options
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    showLoading(containerId) {
        document.getElementById(containerId).innerHTML = `
            <div class="loading">
                <div style="font-size: 24px;">⳾</div>
                <p>Loading...</p>
            </div>
        `;
    }

    showError(containerId, message) {
        document.getElementById(containerId).innerHTML = `
            <div class="alert alert-error">${message}</div>
        `;
    }

    // Dashboard
    showDashboard() {
        document.getElementById("content").innerHTML = `
            <h2>Judging System Dashboard</h2>
            <div class="dashboard-grid">
                ${this.createDashboardCard('Event Types', 'Manage custom event categories', 'showEventTypes')}
                ${this.createDashboardCard('Judging Criteria', 'Manage judging criteria for competitions', 'showCriteria')}
                ${this.createDashboardCard('Competitions', 'Create and manage competitions', 'showCompetitions')}
                ${this.createDashboardCard('Scoring & Results', 'View detailed scoring results', 'showScoringResults')}
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
        const html = eventTypes.length ? `
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
                            <button onclick="adminApp.editEventType(${eventType.event_type_id})" class="btn-edit">Edit</button>
                            <button onclick="adminApp.deleteEventType(${eventType.event_type_id})" class="btn-delete">Delete</button>
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

        try {
            const result = await this.apiRequest('/create-event-type', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (result.success) {
                alert('Event type created successfully!');
                this.showEventTypes();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error creating event type');
        }
    }

    // Competition Management
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
        const html = competitions.length ? `
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
            eventTypes.forEach(eventType => {
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

        try {
            const result = await this.apiRequest('/create-competition', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (result.success) {
                alert('Competition created successfully!');
                this.showCompetitions();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error creating competition');
        }
    }

    // Scoring Results
    async showScoringResults() {
        document.getElementById("content").innerHTML = `
            <h2>Scoring Results & Analytics</h2>
            <div class="form-group">
                <label>Select Competition:</label>
                <select id="resultsCompetition" onchange="adminApp.loadScoringResults()">
                    <option value="">Select Competition to View Results</option>
                </select>
            </div>
            <div id="resultsContent">
                <div class="empty-state">Select a competition to view results</div>
            </div>
        `;

        try {
            const competitions = await this.apiRequest('/competitions');
            const select = document.getElementById("resultsCompetition");
            competitions.forEach(competition => {
                const option = document.createElement("option");
                option.value = competition.competition_id;
                option.textContent = competition.competition_name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading competitions:', error);
        }
    }

    async loadScoringResults() {
        const competitionId = document.getElementById("resultsCompetition").value;
        if (!competitionId) return;

        this.showLoading('resultsContent');
        try {
            const scores = await this.apiRequest(`/overall-scores/${competitionId}`);
            this.renderScoringResults(scores);
        } catch (error) {
            this.showError('resultsContent', 'Error loading scoring results');
        }
    }

    renderScoringResults(scores) {
        if (scores.length === 0) {
            document.getElementById("resultsContent").innerHTML = `
                <div class="empty-state">No scores submitted yet for this competition</div>
            `;
            return;
        }

        // Group and calculate averages
        const participantScores = {};
        scores.forEach(score => {
            if (!participantScores[score.participant_id]) {
                participantScores[score.participant_id] = {
                    participant_name: score.participant_name,
                    scores: [],
                    average: 0
                };
            }
            participantScores[score.participant_id].scores.push(score.total_score);
        });

        // Calculate averages and sort
        const sortedParticipants = Object.values(participantScores)
            .map(participant => {
                participant.average = participant.scores.reduce((a, b) => a + b, 0) / participant.scores.length;
                return participant;
            })
            .sort((a, b) => b.average - a.average);

        const html = `
            <div class="results-table">
                <h3>Competition Rankings</h3>
                <table>
                    <tr>
                        <th>Rank</th>
                        <th>Participant</th>
                        <th>Average Score</th>
                        <th>Judges Scored</th>
                    </tr>
                    ${sortedParticipants.map((participant, index) => `
                        <tr>
                            <td class="rank-${index + 1}">${this.getRankText(index)}</td>
                            <td>${participant.participant_name}</td>
                            <td>${participant.average.toFixed(2)}</td>
                            <td>${participant.scores.length}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;

        document.getElementById("resultsContent").innerHTML = html;
    }

    getRankText(index) {
        const ranks = ['1st', '2nd', '3rd'];
        return ranks[index] || `${index + 1}th`;
    }

    // Judging Criteria Management
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
                
                <div id="criteriaContent">
                    <div class="criteria-empty-state">
                        <div class="empty-icon">
                            <div class="icon-circle-large">
                                <span class="empty-icon-text">⚖️</span>
                            </div>
                        </div>
                        <h3>Ready to Set Up Criteria</h3>
                        <p>Select a competition above to configure its judging criteria. You can create multiple criteria with different weights and scoring ranges.</p>
                    </div>
                </div>
            </div>
        `;

        try {
            const competitions = await this.apiRequest('/competitions');
            const select = document.getElementById("criteriaCompetition");
            competitions.forEach(competition => {
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

    // Competition Criteria Management (direct access from competitions)
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
            this.currentCriteria = criteria.length > 0 ? criteria : [this.createDefaultCriterion(1)];
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
                        <span class="percentage-value" id="totalPercentage">
                            ${this.currentCriteria.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0)}%
                        </span>
                    </div>
                    <div class="percentage-bar">
                        <div class="percentage-fill" style="width: ${Math.min(this.currentCriteria.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0), 100)}%"></div>
                    </div>
                    <div class="percentage-status">
                        ${this.currentCriteria.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0) === 100 
                            ? '<span class="status-success">Ready to save - Total is 100%</span>' 
                            : '<span class="status-warning">Must total 100% to save criteria</span>'}
                    </div>
                </div>
            </div>
        `;

        document.getElementById("criteriaList").innerHTML = html;
    }

    updateCriterion(index, field, value) {
        this.currentCriteria[index][field] = value;
        if (field === 'percentage') {
            this.updateTotalPercentage();
        }
    }

    updateTotalPercentage() {
        const total = this.currentCriteria.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0);
        const totalElement = document.querySelector('.total-percentage');
        if (totalElement) {
            totalElement.innerHTML = `Total Weight: ${total}%`;
            totalElement.style.color = total === 100 ? '#28a745' : '#dc3545';
        }
    }

    addCriterion(competitionId) {
        this.currentCriteria.push(this.createDefaultCriterion(this.currentCriteria.length + 1));
        this.renderCriteriaList();
    }

    removeCriterion(index) {
        if (this.currentCriteria.length > 1) {
            this.currentCriteria.splice(index, 1);
            this.renderCriteriaList();
        }
    }

    async saveCriteria(competitionId) {
        const total = this.currentCriteria.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0);
        if (total !== 100) {
            alert('Total percentage must equal 100%');
            return;
        }

        try {
            const result = await this.apiRequest('/save-competition-criteria', {
                method: 'POST',
                body: JSON.stringify({
                    competition_id: competitionId,
                    criteria: this.currentCriteria
                })
            });

            if (result.success) {
                alert('Criteria saved successfully!');
                this.showCriteria();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error saving criteria');
        }
    }

    // Delete Methods
    async deleteEventType(id) {
        if (confirm('Are you sure you want to delete this event type? This may affect existing competitions.')) {
            try {
                const result = await this.apiRequest(`/delete-event-type/${id}`, { method: 'DELETE' });
                if (result.success) {
                    alert('Event type deleted successfully!');
                    this.showEventTypes();
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error deleting event type');
            }
        }
    }

    async deleteCompetition(id) {
        if (confirm('Are you sure you want to delete this competition? This will also delete all participants, judges, and scores associated with it.')) {
            try {
                const result = await this.apiRequest(`/delete-competition/${id}`, { method: 'DELETE' });
                if (result.success) {
                    alert('Competition deleted successfully!');
                    this.showCompetitions();
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error deleting competition');
            }
        }
    }

    // Edit Methods
    async editEventType(id) { 
        alert('Edit Event Type feature - would show form with existing data loaded');
    }
    
    async editCompetition(id) {
        try {
            // First, get the competition data
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

            // Load event types and set the current selection
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
            
            eventTypes.forEach(eventType => {
                const option = document.createElement("option");
                option.value = eventType.event_type_id;
                option.textContent = `${eventType.type_name} ${eventType.is_pageant ? '(Pageant)' : '(Regular)'}`;
                
                // Set selected if this is the current event type
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

        try {
            const result = await this.apiRequest(`/update-competition/${competitionId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (result.success) {
                alert('Competition updated successfully!');
                this.showCompetitions();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error updating competition');
            console.error('Update competition error:', error);
        }
    }
}

// Initialize the admin dashboard
const adminApp = new AdminDashboard();

// Global functions for backwards compatibility
window.showDashboard = () => adminApp.showDashboard();
window.showEventTypes = () => adminApp.showEventTypes();
window.showCompetitions = () => adminApp.showCompetitions();
window.showScoringResults = () => adminApp.showScoringResults();
window.showCriteria = () => adminApp.showCriteria();