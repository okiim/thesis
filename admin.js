// Enhanced Admin Dashboard - Debugged and Fixed Implementation
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
            if (!this.user || this.user.role !== 'admin') {
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
                <div>Welcome, Admin</div>
                <button class="logout-btn" onclick="adminApp.logout()">Logout</button>
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

    // Confirmation Modal System - Improved (Enter = Confirm, Esc = Cancel, focus & a11y)
    showConfirmationModal(title, message, subtitle, type, onConfirm) {
        const iconMap = {
            'delete-event': '⚠',
            'delete-competition': '⚠',
            'delete-user': '⚠',
            'logout': '🚪',
            'save-criteria': '💾',
            'validation-error': '⚠',
            'create-event': '✓',
            'create-competition': '✓',
            'create-user': '✓',
            'update-event': '✓',
            'update-competition': '✓',
            'update-user': '✓'
        };

        const buttonTextMap = {
            'delete-event': 'Yes, Delete',
            'delete-competition': 'Yes, Delete',
            'delete-user': 'Yes, Delete',
            'logout': 'Yes, Logout',
            'save-criteria': 'Yes, Save',
            'validation-error': 'OK',
            'create-event': 'Yes, Create',
            'create-competition': 'Yes, Create',
            'create-user': 'Yes, Create',
            'update-event': 'Yes, Update',
            'update-competition': 'Yes, Update',
            'update-user': 'Yes, Update'
        };

        const icon = iconMap[type] || '⚠';
        const buttonText = buttonTextMap[type] || 'Yes, Continue';
        const showCancelButton = type !== 'validation-error';

        // Build overlay with a11y attributes
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
                        <span class="btn-icon">${(type.includes('delete')) ? '🗑' : '✓'}</span>
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
        const cancelBtn  = modal.querySelector('.confirmation-cancel-btn');

        const doConfirm = () => {
            try { onConfirm && onConfirm(); } finally { this.closeConfirmationModal(); }
        };

        const onKeyDown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); doConfirm(); }
            if (e.key === 'Escape') { e.preventDefault(); this.closeConfirmationModal(); }
        };

        // Wire events
        confirmBtn?.addEventListener('click', doConfirm);
        cancelBtn?.addEventListener('click', () => this.closeConfirmationModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeConfirmationModal();
        });
        modal.addEventListener('keydown', onKeyDown);

        // Focus management
        (confirmBtn || modal).focus();

        // Keep a handle so close() can clean up if you want
        this._adminModalKeyHandler = onKeyDown;
    }

    closeConfirmationModal() {
        const modal = document.querySelector('.confirmation-modal-overlay');
        if (modal) {
            modal.remove();
            if (this.modalKeyHandler) {
                document.removeEventListener('keydown', this.modalKeyHandler);
                this.modalKeyHandler = null;
            }
        }
        this.pendingConfirmation = null;
    }

    executeConfirmation() {
        if (this.pendingConfirmation) {
            try {
                this.pendingConfirmation();
            } catch (error) {
                console.error('Error executing confirmation:', error);
            }
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

    // Fixed API request method
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
                ${this.createDashboardCard('Event Types', 'Manage custom event categories', 'showEventTypes')}
                ${this.createDashboardCard('Judging Criteria', 'Manage judging criteria for competitions', 'showCriteria')}
                ${this.createDashboardCard('Competitions', 'Create and manage competitions', 'showCompetitions')}
                ${this.createDashboardCard('Users', 'Manage judge and staff accounts', 'showUsers')}
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
        if (element) {
            element.textContent = text;
        } else {
            console.warn(`Element ${id} not found for text update`);
        }
    }

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        } else {
            console.warn(`Element ${id} not found for hiding`);
        }
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
        } else {
            console.warn(`Element ${id} not found for showing`);
        }
    }

    // Event Types Management - Fixed
    async showEventTypes() {
        console.log('Showing event types');
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        content.innerHTML = `
            <h2>Event Types Management</h2>
            <button onclick="adminApp.showCreateEventTypeForm()" class="card-button">Add New Event Type</button>
            <div id="eventTypesList"></div>
        `;
        
        this.showLoading('eventTypesList');
        try {
            const eventTypes = await this.apiRequest('/event-types');
            this.renderEventTypes(eventTypes);
        } catch (error) {
            console.error('Error loading event types:', error);
            this.showError('eventTypesList', `Error loading event types: ${error.message}`);
        }
    }

    renderEventTypes(eventTypes) {
        const container = document.getElementById("eventTypesList");
        if (!container) {
            console.error('eventTypesList container not found');
            return;
        }

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
        
        container.innerHTML = html;
    }

    showCreateEventTypeForm() {
        console.log('Showing create event type form');
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        content.innerHTML = `
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

        // Add form submit handler
        const form = document.getElementById("eventTypeForm");
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createEventType();
            });
        }
    }

    async createEventType() {
        try {
            const data = {
                type_name: document.getElementById("type_name").value.trim(),
                description: document.getElementById("description").value.trim(),
                is_pageant: document.getElementById("is_pageant").value === "1"
            };

            // Basic validation
            if (!data.type_name) {
                alert('Event type name is required');
                return;
            }

            console.log('Creating event type:', data);

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
                        
                        console.log('Create event type result:', result);
                        
                        if (result && result.success) {
                            this.showSuccessMessage('Event type created successfully!');
                            this.showEventTypes();
                        } else {
                            const errorMsg = result?.error || 'Unknown error occurred';
                            alert('Error: ' + errorMsg);
                        }
                    } catch (error) {
                        console.error('Create event type error:', error);
                        alert('Error creating event type: ' + error.message);
                    }
                }
            );
        } catch (error) {
            console.error('Form processing error:', error);
            alert('Error processing form data');
        }
    }

    async editEventType(id) {
        try {
            const eventTypes = await this.apiRequest('/event-types');
            const eventType = (eventTypes || []).find(et => et.event_type_id == id);
            if (!eventType) {
                alert('Event type not found');
                return;
            }

            const content = document.getElementById("content");
            if (!content) {
                console.error('Content element not found');
                return;
            }

            content.innerHTML = `
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

            const form = document.getElementById("editEventTypeForm");
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updateEventType(id);
                });
            }
            
        } catch (error) {
            console.error('Edit event type error:', error);
            alert('Error loading event type data for editing: ' + error.message);
        }
    }

    async updateEventType(eventTypeId) {
        try {
            const data = {
                type_name: document.getElementById("edit_type_name").value.trim(),
                description: document.getElementById("edit_description").value.trim(),
                is_pageant: document.getElementById("edit_is_pageant").value === "1"
            };

            if (!data.type_name) {
                alert('Event type name is required');
                return;
            }

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
                        
                        if (result && result.success) {
                            this.showSuccessMessage('Event type updated successfully!');
                            this.showEventTypes();
                        } else {
                            const errorMsg = result?.error || 'Unknown error occurred';
                            alert('Error: ' + errorMsg);
                        }
                    } catch (error) {
                        console.error('Update event type error:', error);
                        alert('Error updating event type: ' + error.message);
                    }
                }
            );
        } catch (error) {
            console.error('Form processing error:', error);
            alert('Error processing form data: ' + error.message);
        }
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
                    if (result && result.success) {
                        this.showSuccessMessage('Event type deleted successfully!');
                        this.showEventTypes();
                    } else {
                        const errorMsg = result?.error || 'Unknown error occurred';
                        alert('Error: ' + errorMsg);
                    }
                } catch (error) {
                    console.error('Delete event type error:', error);
                    alert('Error deleting event type: ' + error.message);
                }
            }
        );
    }

    async showCompetitionsByEventType(eventTypeId) {
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }

        content.innerHTML = `
            <div class="competitions-by-event-type">
                <div class="event-type-header">
                    <h2>Event Type Details</h2>
                    <div class="event-type-details" id="et-details">
                        <p>Loading event type details...</p>
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
                        <div class="empty-state">Loading competitions...</div>
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
            console.error('Error loading competitions for event type:', err);
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

            const content = document.getElementById("content");
            if (!content) {
                console.error('Content element not found');
                return;
            }

            content.innerHTML = `
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

            const form = document.getElementById("competitionFromEventForm");
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.createCompetitionFromForm(eventTypeId);
                });
            }
            
        } catch (error) {
            console.error('Create competition from event type error:', error);
            alert('Error loading event type details: ' + error.message);
        }
    }

    async createCompetitionFromForm(eventTypeId) {
        try {
            const data = {
                competition_name: document.getElementById("competition_name").value.trim(),
                event_type_id: eventTypeId,
                competition_date: document.getElementById("competition_date").value,
                event_description: document.getElementById("event_description").value.trim()
            };

            if (!data.competition_name) {
                alert('Competition name is required');
                return;
            }

            if (!data.competition_date) {
                alert('Competition date is required');
                return;
            }

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
                        
                        if (result && result.success) {
                            this.showSuccessMessage('Competition created successfully!');
                            this.showCompetitions();
                        } else {
                            const errorMsg = result?.error || 'Unknown error occurred';
                            alert('Error: ' + errorMsg);
                        }
                    } catch (error) {
                        console.error('Create competition error:', error);
                        alert('Error creating competition: ' + error.message);
                    }
                }
            );
        } catch (error) {
            console.error('Form processing error:', error);
            alert('Error processing form data: ' + error.message);
        }
    }

    // Competitions Management - Fixed
    async showCompetitions() {
        console.log('Showing competitions');
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        content.innerHTML = `
            <h2>Manage Competitions</h2>
            <button onclick="adminApp.showCreateCompetitionForm()" class="card-button">Add New Competition</button>
            <div id="competitionsList"></div>
        `;

        this.showLoading('competitionsList');
        try {
            const competitions = await this.apiRequest('/competitions');
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
            <div class="competitions-grid">
                ${competitions.map(competition => `
                    <div class="dashboard-card">
                        <h3>${competition.competition_name} 
                            <span class="badge ${competition.is_pageant ? 'badge-pageant' : 'badge-regular'}">
                                ${competition.is_pageant ? 'PAGEANT' : 'REGULAR'}
                            </span>
                        </h3>
                        <div class="competition-details">
                            <p><strong>Type:</strong> ${competition.type_name || 'N/A'}</p>
                            <p><strong>Date:</strong> ${competition.competition_date || 'Not set'}</p>
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

        container.innerHTML = html;
    }

    showCreateCompetitionForm() {
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        content.innerHTML = `
            <h2>Create New Competition</h2>
            <form id="competitionForm" class="form-container">
                <label>Competition Name:</label>
                <input type="text" id="competition_name" required placeholder="Enter competition name">
                
                <label>Event Type:</label>
                <select id="event_type_id" required>
                    <option value="">Select Event Type</option>
                </select>
                
                <label>Competition Date:</label>
                <input type="date" id="competition_date" required>
                
                <label>Event Description:</label>
                <textarea id="event_description" rows="3" placeholder="Describe this competition..."></textarea>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Create Competition</button>
                    <button type="button" onclick="adminApp.showCompetitions()" class="btn-secondary">Cancel</button>
                </div>
            </form>
        `;

        this.loadEventTypesForDropdown();
        
        const form = document.getElementById("competitionForm");
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createCompetition();
            });
        }
    }

    async loadEventTypesForDropdown() {
        try {
            const eventTypes = await this.apiRequest('/event-types');
            const select = document.getElementById("event_type_id");
            if (!select) return;
            
            (eventTypes || []).forEach(eventType => {
                const option = document.createElement("option");
                option.value = eventType.event_type_id;
                option.textContent = `${eventType.type_name} ${eventType.is_pageant ? '(Pageant)' : '(Regular)'}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading event types for dropdown:', error);
        }
    }

    async createCompetition() {
        try {
            const data = {
                competition_name: document.getElementById("competition_name").value.trim(),
                event_type_id: document.getElementById("event_type_id").value,
                competition_date: document.getElementById("competition_date").value,
                event_description: document.getElementById("event_description").value.trim()
            };

            if (!data.competition_name) {
                alert('Competition name is required');
                return;
            }

            if (!data.event_type_id) {
                alert('Event type is required');
                return;
            }

            if (!data.competition_date) {
                alert('Competition date is required');
                return;
            }

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
                        
                        if (result && result.success) {
                            this.showSuccessMessage('Competition created successfully!');
                            this.showCompetitions();
                        } else {
                            const errorMsg = result?.error || 'Unknown error occurred';
                            alert('Error: ' + errorMsg);
                        }
                    } catch (error) {
                        console.error('Create competition error:', error);
                        alert('Error creating competition: ' + error.message);
                    }
                }
            );
        } catch (error) {
            console.error('Form processing error:', error);
            alert('Error processing form data: ' + error.message);
        }
    }

    async editCompetition(id) {
        try {
            const competition = await this.apiRequest(`/competition/${id}`);
            
            const content = document.getElementById("content");
            if (!content) {
                console.error('Content element not found');
                return;
            }
            
            content.innerHTML = `
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
            
            const form = document.getElementById("editCompetitionForm");
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updateCompetition(id);
                });
            }
        } catch (error) {
            console.error('Edit competition error:', error);
            alert('Error loading competition data for editing: ' + error.message);
        }
    }

    async loadEventTypesForEdit(currentEventTypeId) {
        try {
            const eventTypes = await this.apiRequest('/event-types');
            const select = document.getElementById("edit_event_type_id");
            if (!select) return;
            
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
        try {
            const data = {
                competition_name: document.getElementById("edit_competition_name").value.trim(),
                event_type_id: document.getElementById("edit_event_type_id").value,
                competition_date: document.getElementById("edit_competition_date").value,
                event_description: document.getElementById("edit_event_description").value.trim()
            };

            if (!data.competition_name) {
                alert('Competition name is required');
                return;
            }

            if (!data.event_type_id) {
                alert('Event type is required');
                return;
            }

            if (!data.competition_date) {
                alert('Competition date is required');
                return;
            }

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
                        
                        if (result && result.success) {
                            this.showSuccessMessage('Competition updated successfully!');
                            this.showCompetitions();
                        } else {
                            const errorMsg = result?.error || 'Unknown error occurred';
                            alert('Error: ' + errorMsg);
                        }
                    } catch (error) {
                        console.error('Update competition error:', error);
                        alert('Error updating competition: ' + error.message);
                    }
                }
            );
        } catch (error) {
            console.error('Form processing error:', error);
            alert('Error processing form data: ' + error.message);
        }
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
                    if (result && result.success) {
                        this.showSuccessMessage('Competition deleted successfully!');
                        this.showCompetitions();
                    } else {
                        const errorMsg = result?.error || 'Unknown error occurred';
                        alert('Error: ' + errorMsg);
                    }
                } catch (error) {
                    console.error('Delete competition error:', error);
                    alert('Error deleting competition: ' + error.message);
                }
            }
        );
    }

    // Users Management
    async showUsers() {
        console.log('Showing users');
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        content.innerHTML = `
            <h2>Judge & Staff Account Management</h2>
            <p style="color: #666; margin-bottom: 20px;">Manage login accounts for judges and staff members who need system access.</p>
            <button onclick="adminApp.showCreateUserForm()" class="card-button">Add New Account</button>
            <div id="usersList"></div>
        `;
        
        this.showLoading('usersList');
        try {
            const users = await this.apiRequest('/users');
            this.renderUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('usersList', `Error loading users: ${error.message}`);
        }
    }

    renderUsers(users) {
        const container = document.getElementById("usersList");
        if (!container) {
            console.error('usersList container not found');
            return;
        }

        const html = users && users.length ? `
            <table>
                <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                ${users.map(user => `
                    <tr>
                        <td><strong>${user.username}</strong></td>
                        <td>${user.full_name || 'N/A'}</td>
                        <td>
                            <span class="badge ${user.role === 'admin' ? 'badge-pageant' : 'badge-regular'}">
                                ${user.role.toUpperCase()}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${user.is_active ? 'status-ready' : 'status-setup'}">
                                ${user.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            <div class="actions-cell">
                                <button onclick="adminApp.editUser(${user.user_id})" class="btn-edit">Edit</button>
                                ${user.role !== 'admin' ? `
                                    <button onclick="adminApp.deleteUser(${user.user_id})" class="btn-delete">Delete</button>
                                ` : '<span style="color: #999;">Protected</span>'}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </table>
        ` : '<div class="empty-state">No users found. Create your first user!</div>';
        
        container.innerHTML = html;
    }

    showCreateUserForm() {
        console.log('Showing create user form');
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        content.innerHTML = `
            <h2>Create New Judge/Staff Account</h2>
            <p style="color: #666; margin-bottom: 20px;">Create a login account for a judge or staff member. All fields are required.</p>
            <form id="userForm" class="form-container">
                <label>Username: <span style="color: red;">*</span></label>
                <input type="text" id="username" required placeholder="Enter username">
                
                <label>Password: <span style="color: red;">*</span></label>
                <input type="password" id="password" required placeholder="Enter password (minimum 6 characters)" minlength="6">
                
                <label>Full Name: <span style="color: red;">*</span></label>
                <input type="text" id="full_name" required placeholder="Enter full name">
                
                <label>Role: <span style="color: red;">*</span></label>
                <select id="role" required>
                    <option value="">-- Select Role --</option>
                    <option value="judge">Judge - Can score competitions</option>
                    <option value="admin">Staff/Admin - Full system access</option>
                </select>
                
                <label>Status: <span style="color: red;">*</span></label>
                <select id="is_active" required>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                </select>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Create Account</button>
                    <button type="button" onclick="adminApp.showUsers()" class="btn-secondary">Cancel</button>
                </div>
            </form>
        `;

        const form = document.getElementById("userForm");
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createUser();
            });
        }
    }

    async createUser() {
        try {
            const data = {
                username: document.getElementById("username").value.trim(),
                password: document.getElementById("password").value,
                full_name: document.getElementById("full_name").value.trim(),
                role: document.getElementById("role").value,
                is_active: document.getElementById("is_active").value === "1"
            };

            // Validation
            if (!data.username) {
                alert('Username is required');
                return;
            }

            if (!data.password) {
                alert('Password is required');
                return;
            }

            if (data.password.length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }

            if (!data.full_name) {
                alert('Full Name is required');
                return;
            }

            if (!data.role) {
                alert('Role is required');
                return;
            }

            this.showConfirmationModal(
                'Create User Account',
                'Are you sure you want to create this user account?',
                `Name: "${data.full_name}" | Username: "${data.username}" | Role: ${data.role.toUpperCase()}`,
                'create-user',
                async () => {
                    try {
                        const result = await this.apiRequest('/create-user', {
                            method: 'POST',
                            body: JSON.stringify(data)
                        });
                        
                        if (result && result.success) {
                            this.showSuccessMessage('User account created successfully!');
                            this.showUsers();
                        } else {
                            const errorMsg = result?.error || 'Unknown error occurred';
                            alert('Error: ' + errorMsg);
                        }
                    } catch (error) {
                        console.error('Create user error:', error);
                        alert('Error creating user: ' + error.message);
                    }
                }
            );
        } catch (error) {
            console.error('Form processing error:', error);
            alert('Error processing form data');
        }
    }

    async editUser(id) {
        try {
            const users = await this.apiRequest('/users');
            const user = (users || []).find(u => u.user_id == id);
            if (!user) {
                alert('User not found');
                return;
            }

            const content = document.getElementById("content");
            if (!content) {
                console.error('Content element not found');
                return;
            }

            content.innerHTML = `
                <h2>Edit Judge/Staff Account</h2>
                <p style="color: #666; margin-bottom: 20px;">Update login account details for this judge or staff member.</p>
                <form id="editUserForm" class="form-container">
                    <label>Username:</label>
                    <input type="text" id="edit_username" required value="${user.username}" disabled>
                    <small style="color: #666;">Username cannot be changed</small>
                    
                    <label>New Password (leave blank to keep current):</label>
                    <input type="password" id="edit_password" placeholder="Enter new password or leave blank">
                    
                    <label>Full Name:</label>
                    <input type="text" id="edit_full_name" value="${user.full_name || ''}" placeholder="Enter full name (optional)">
                    
                    <label>Role:</label>
                    <select id="edit_role" required>
                        <option value="judge" ${user.role === 'judge' ? 'selected' : ''}>Judge - Can score competitions</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Staff/Admin - Full system access</option>
                    </select>
                    
                    <label>Status:</label>
                    <select id="edit_is_active" required>
                        <option value="1" ${user.is_active ? 'selected' : ''}>Active</option>
                        <option value="0" ${!user.is_active ? 'selected' : ''}>Inactive</option>
                    </select>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Update Account</button>
                        <button type="button" onclick="adminApp.showUsers()" class="btn-secondary">Cancel</button>
                    </div>
                </form>
            `;

            const form = document.getElementById("editUserForm");
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updateUser(id);
                });
            }
            
        } catch (error) {
            console.error('Edit user error:', error);
            alert('Error loading user data for editing: ' + error.message);
        }
    }

    async updateUser(userId) {
        try {
            const password = document.getElementById("edit_password").value;
            const data = {
                full_name: document.getElementById("edit_full_name").value.trim(),
                role: document.getElementById("edit_role").value,
                is_active: document.getElementById("edit_is_active").value === "1"
            };

            // Only include password if it's not empty
            if (password) {
                data.password = password;
            }

            this.showConfirmationModal(
                'Update User Account',
                'Are you sure you want to update this user account?',
                `User role: ${data.role}`,
                'update-user',
                async () => {
                    try {
                        const result = await this.apiRequest(`/update-user/${userId}`, {
                            method: 'PUT',
                            body: JSON.stringify(data)
                        });
                        
                        if (result && result.success) {
                            this.showSuccessMessage('User account updated successfully!');
                            this.showUsers();
                        } else {
                            const errorMsg = result?.error || 'Unknown error occurred';
                            alert('Error: ' + errorMsg);
                        }
                    } catch (error) {
                        console.error('Update user error:', error);
                        alert('Error updating user: ' + error.message);
                    }
                }
            );
        } catch (error) {
            console.error('Form processing error:', error);
            alert('Error processing form data: ' + error.message);
        }
    }

    async deleteUser(id) {
        this.showConfirmationModal(
            'Delete User Account',
            'Are you sure you want to delete this user account?',
            'This action cannot be undone.',
            'delete-user',
            async () => {
                try {
                    const result = await this.apiRequest(`/delete-user/${id}`, { method: 'DELETE' });
                    if (result && result.success) {
                        this.showSuccessMessage('User account deleted successfully!');
                        this.showUsers();
                    } else {
                        const errorMsg = result?.error || 'Unknown error occurred';
                        alert('Error: ' + errorMsg);
                    }
                } catch (error) {
                    console.error('Delete user error:', error);
                    alert('Error deleting user: ' + error.message);
                }
            }
        );
    }

    // Criteria Management - Fixed
    async showCriteria() {
        console.log('Showing criteria management');
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        content.innerHTML = `
            <div class="criteria-management-container">
                <div class="criteria-main-header">
                    <h2>Judging Criteria Management</h2>
                    <p>Configure judging criteria for your competitions. Select a competition below to manage its criteria.</p>
                </div>
                
                <div class="competition-selector-card">
                    <div class="selector-content">
                        <div class="selector-form">
                            <label class="selector-label">Choose Competition</label>
                            <select id="criteriaCompetition" class="large-select">
                                <option value="">Select Competition to Manage Criteria</option>
                            </select>
                            <p class="selector-help">Select a competition from the dropdown above to view and edit its judging criteria.</p>
                        </div>
                    </div>
                </div>

                <div class="form-actions mt-20" style="margin-top: 20px;">
                    <button onclick="adminApp.showDashboard()" class="btn-secondary">Back to Dashboard</button>
                </div>
            </div>
        `;

        // Add event listener for dropdown change
        const select = document.getElementById("criteriaCompetition");
        if (select) {
            select.addEventListener('change', () => this.loadCompetitionCriteria());
        }

        // Load competitions for dropdown
        try {
            const competitions = await this.apiRequest('/competitions');
            (competitions || []).forEach(competition => {
                const option = document.createElement("option");
                option.value = competition.competition_id;
                option.textContent = `${competition.competition_name} (${competition.type_name || 'Unknown Type'})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading competitions for criteria:', error);
        }
    }

    async loadCompetitionCriteria() {
        const select = document.getElementById("criteriaCompetition");
        if (!select) return;
        
        const competitionId = select.value;
        if (!competitionId) return;

        this.currentCompetitionId = competitionId;
        this.manageCriteria(competitionId);
    }

    async manageCriteria(competitionId) {
        console.log('Managing criteria for competition:', competitionId);
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }
        
        content.innerHTML = `
            <h2>Manage Competition Criteria</h2>
            <button onclick="adminApp.addCriterion()" class="card-button">Add Criterion</button>
            <div id="criteriaList"></div>
            <div class="form-actions mt-20" style="margin-top: 20px;">
                <button onclick="adminApp.saveCriteria(${competitionId})" class="btn-primary">Save All Criteria</button>
                <button onclick="adminApp.showCriteria()" class="btn-secondary">Back to Criteria</button>
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
        const container = document.getElementById("criteriaList");
        if (!container) {
            console.error('criteriaList container not found');
            return;
        }

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
                                           class="form-input criteria-name-input" 
                                           value="${criterion.criteria_name}" 
                                           placeholder="e.g., Speed, Technique, Creativity, Performance"
                                           id="criteria_name_${index}">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-field">
                                    <label class="field-label">Description</label>
                                    <textarea class="form-textarea criteria-description-input" 
                                              rows="3"
                                              placeholder="Describe what judges should evaluate for this criterion..."
                                              id="description_${index}">${criterion.description}</textarea>
                                </div>
                            </div>
                            
                            <div class="form-row-split">
                                <div class="form-field">
                                    <label class="field-label">Weight Percentage</label>
                                    <div class="input-with-unit">
                                        <input type="number" 
                                               class="form-input-large percentage-input" 
                                               value="${criterion.percentage}" 
                                               min="0" 
                                               max="100" 
                                               step="0.01"
                                               placeholder="0"
                                               id="percentage_${index}">
                                        <span class="input-unit">%</span>
                                    </div>
                                </div>
                                
                                <div class="form-field">
                                    <label class="field-label">Maximum Score</label>
                                    <div class="input-with-unit">
                                        <input type="number" 
                                               class="form-input-large max-score-input" 
                                               value="${criterion.max_score}" 
                                               min="1" 
                                               step="1"
                                               placeholder="100"
                                               id="max_score_${index}">
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

        container.innerHTML = html;
        
        // Add event listeners for the input fields
        this.attachCriteriaEventListeners();
    }

    attachCriteriaEventListeners() {
        console.log('Attaching criteria event listeners with simple ID approach...');
        
        // Attach listeners for each criterion by index
        this.currentCriteria.forEach((criterion, index) => {
            // Criteria name input
            const nameInput = document.getElementById(`criteria_name_${index}`);
            if (nameInput) {
                nameInput.oninput = (e) => {
                    console.log(`Updating criteria name ${index}:`, e.target.value);
                    this.updateCriterion(index, 'criteria_name', e.target.value);
                };
                console.log(`✓ Attached listener to criteria_name_${index}`);
            } else {
                console.error(`✗ Could not find criteria_name_${index}`);
            }
            
            // Description textarea
            const descTextarea = document.getElementById(`description_${index}`);
            if (descTextarea) {
                descTextarea.oninput = (e) => {
                    console.log(`Updating description ${index}:`, e.target.value);
                    this.updateCriterion(index, 'description', e.target.value);
                };
                console.log(`✓ Attached listener to description_${index}`);
            } else {
                console.error(`✗ Could not find description_${index}`);
            }
            
            // Percentage input
            const percentageInput = document.getElementById(`percentage_${index}`);
            if (percentageInput) {
                percentageInput.oninput = (e) => {
                    console.log(`Percentage input ${index}:`, e.target.value);
                    this.updateCriterion(index, 'percentage', e.target.value);
                };
                percentageInput.onchange = (e) => {
                    console.log(`Percentage change ${index}:`, e.target.value);
                    this.updateCriterion(index, 'percentage', e.target.value);
                };
                console.log(`✓ Attached PERCENTAGE listener to percentage_${index}`);
            } else {
                console.error(`✗ CRITICAL: Could not find percentage_${index}`);
            }
            
            // Max score input
            const maxScoreInput = document.getElementById(`max_score_${index}`);
            if (maxScoreInput) {
                maxScoreInput.oninput = (e) => {
                    console.log(`Updating max score ${index}:`, e.target.value);
                    this.updateCriterion(index, 'max_score', e.target.value);
                };
                console.log(`✓ Attached listener to max_score_${index}`);
            } else {
                console.error(`✗ Could not find max_score_${index}`);
            }
        });
        
        console.log('Event listener attachment complete.');
    }

    updateCriterion(index, field, value) {
        console.log(`updateCriterion called: index=${index}, field=${field}, value=${value}`);
        
        if (index < 0 || index >= this.currentCriteria.length) {
            console.error(`Invalid criterion index: ${index}`);
            return;
        }

        if (field === 'percentage' || field === 'max_score') {
            const num = Number(value);
            this.currentCriteria[index][field] = isNaN(num) ? 0 : num;
            console.log(`Updated ${field} to ${this.currentCriteria[index][field]} for criterion ${index}`);
        } else {
            this.currentCriteria[index][field] = value;
            console.log(`Updated ${field} to "${value}" for criterion ${index}`);
        }
        
        if (field === 'percentage') {
            this.updateTotalPercentage();
        }
        
        console.log('Current criteria state:', this.currentCriteria);
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

                    if (result && result.success) {
                        this.showSuccessMessage('Criteria saved successfully!');
                        this.showCriteria();
                    } else {
                        const errorMsg = result?.error || 'Unknown error occurred';
                        alert('Error: ' + errorMsg);
                    }
                } catch (error) {
                    console.error('Save criteria error:', error);
                    alert('Error saving criteria: ' + error.message);
                }
            }
        );
    }

    // System Overview - Fixed
    async showScoringResults() {
        console.log('Showing system overview');
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }

        content.innerHTML = `
            <div class="summary-container">
                <h2>System Overview & Statistics</h2>
                <p style="text-align: center; color: var(--muted, #666); font-size: 16px; margin-bottom: 30px;">
                    Comprehensive dashboard showing system-wide statistics, trends, and performance metrics
                </p>

                <div id="overview-loading" class="loading">
                    <div style="font-size: 24px;">⏳</div>
                    <p>Loading system overview...</p>
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

                <div class="form-actions mt-20" style="margin-top: 20px;">
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
            
            // Show loading state
            this.hideElement('overview-error');
            this.hideElement('main-stats');
            this.showElement('overview-loading');
            
            // Fetch all data with error handling for each endpoint
            const endpoints = [
                '/competitions',
                '/event-types', 
                '/participants',
                '/judges'
            ];
            
            const responses = await Promise.allSettled(
                endpoints.map(endpoint => this.apiRequest(endpoint))
            );
            
            // Process results
            const [competitionsResult, eventTypesResult, participantsResult, judgesResult] = responses;
            
            const competitions = competitionsResult.status === 'fulfilled' ? competitionsResult.value : [];
            const eventTypes = eventTypesResult.status === 'fulfilled' ? eventTypesResult.value : [];
            const participants = participantsResult.status === 'fulfilled' ? participantsResult.value : [];
            const judges = judgesResult.status === 'fulfilled' ? judgesResult.value : [];

            // Update main statistics
            this.updateElementText('total-competitions', competitions?.length || 0);
            this.updateElementText('total-event-types', eventTypes?.length || 0);
            this.updateElementText('total-participants', participants?.length || 0);
            this.updateElementText('total-judges', judges?.length || 0);

            // Show sections
            this.hideElement('overview-loading');
            this.hideElement('overview-error');
            this.showElement('main-stats');

            // Animate counters
            this.animateOverviewCounters();

        } catch (error) {
            console.error('Error loading overview data:', error);
            this.hideElement('overview-loading');
            this.showElement('overview-error');
            
            const errorContainer = document.getElementById('overview-error');
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div class="alert alert-error">
                        <strong>Error:</strong> Unable to load system overview. ${error.message}
                    </div>
                `;
            }
        }
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
}

// Initialize the admin dashboard
const adminApp = new AdminDashboard();

// Global functions for backwards compatibility
window.showDashboard = () => adminApp.showDashboard();
window.showEventTypes = () => adminApp.showEventTypes();
window.showCompetitions = () => adminApp.showCompetitions();
window.showUsers = () => adminApp.showUsers();
window.showScoringResults = () => adminApp.showScoringResults();
window.showCriteria = () => adminApp.showCriteria();

// Make sure all admin functions are globally accessible
window.adminApp = adminApp;

// Explicitly expose functions used by inline onclicks
window.showCompetitionsByEventType = (eventTypeId) => adminApp.showCompetitionsByEventType(eventTypeId);
window.createCompetitionFromEventType = (eventTypeId) => adminApp.createCompetitionFromEventType(eventTypeId);
window.editEventType = (eventTypeId) => adminApp.editEventType(eventTypeId);
window.deleteEventType = (eventTypeId) => adminApp.deleteEventType(eventTypeId);
