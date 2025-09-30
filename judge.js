// Enhanced Judge Dashboard - Complete Implementation Matching Admin Format
class JudgeDashboard {
    constructor() {
        this.baseURL = 'http://localhost:3002';
        this.user = null;
        this.judgeInfo = null;
        this.currentCompetition = null;
        this.criteria = [];
        this.participants = [];
        this.currentParticipantId = null;
        this.scores = {};
        this.init();
    }

    init() {
        // Check if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.checkAuthentication();
                this.loadJudgeInfo();
            });
        } else {
            // DOM is already loaded
            this.checkAuthentication();
            this.loadJudgeInfo();
        }
    }

    checkAuthentication() {
        try {
            this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
            if (!this.user || this.user.role !== 'judge') {
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
                <div style="font-size: 12px;">Role: Judge</div>
                <button class="logout-btn" onclick="judgeApp.logout()">Logout</button>
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
            'delete-score': '⚠️',
            'logout': '🚪',
            'submit-score': '💾',
            'validation-error': '⚠️',
            'update-score': '✏️'
        };

        const buttonTextMap = {
            'delete-score': 'Yes, Delete',
            'logout': 'Yes, Logout',
            'submit-score': 'Yes, Submit',
            'validation-error': 'OK',
            'update-score': 'Yes, Update'
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
                        <span class="btn-icon">${(type === 'delete-score') ? '🗑️' : '✔️'}</span>
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

    async loadJudgeInfo() {
        try {
            const result = await this.apiRequest(`/judge-info/${this.user.user_id}`);
            this.judgeInfo = result;
            
            if (result.competition_id) {
                const competition = await this.apiRequest(`/competition/${result.competition_id}`);
                this.currentCompetition = competition;
                await this.loadCompetitionData();
            }
            
            this.showDashboard();
        } catch (error) {
            console.error('Error loading judge info:', error);
            this.showDashboard();
        }
    }

    async loadCompetitionData() {
        if (!this.currentCompetition) return;

        try {
            const [criteria, participants] = await Promise.all([
                this.apiRequest(`/competition-criteria/${this.currentCompetition.competition_id}`),
                this.apiRequest(`/competition-participants/${this.currentCompetition.competition_id}`)
            ]);
            
            this.criteria = criteria || [];
            this.participants = participants || [];
        } catch (error) {
            console.error('Error loading competition data:', error);
        }
    }

    showDashboard() {
        console.log('Showing dashboard');
        const content = document.getElementById("content");
        if (!content) {
            console.error('Content element not found');
            return;
        }

        if (!this.currentCompetition) {
            content.innerHTML = `
                <div class="no-competition">
                    <h2>Welcome, ${this.judgeInfo ? this.judgeInfo.judge_name : this.user.username}!</h2>
                    <div class="alert alert-warning">
                        <h3>No Competition Assigned</h3>
                        <p>You haven't been assigned to a competition yet. Please contact the administrator to get assigned to a competition.</p>
                    </div>
                    <div class="judge-info-card">
                        ${this.judgeInfo ? `
                            <h3>Your Profile</h3>
                            <p><strong>Name:</strong> ${this.judgeInfo.judge_name}</p>
                            <p><strong>Expertise:</strong> ${this.judgeInfo.expertise}</p>
                            <p><strong>Experience:</strong> ${this.judgeInfo.experience_years} years</p>
                            ${this.judgeInfo.credentials ? `<p><strong>Credentials:</strong> ${this.judgeInfo.credentials}</p>` : ''}
                        ` : ''}
                    </div>
                </div>
            `;
            return;
        }
        
        content.innerHTML = `
            <h2>Judge Dashboard - ${this.currentCompetition.competition_name}</h2>
            <div class="competition-info-banner">
                <h3>${this.currentCompetition.competition_name}</h3>
                <p><strong>Type:</strong> ${this.currentCompetition.type_name}</p>
                <p><strong>Date:</strong> ${new Date(this.currentCompetition.competition_date).toLocaleDateString()}</p>
                <span class="badge ${this.currentCompetition.is_pageant ? 'badge-pageant' : 'badge-regular'}">
                    ${this.currentCompetition.is_pageant ? 'PAGEANT' : 'REGULAR'}
                </span>
            </div>

            <div class="dashboard-grid">
                ${this.createDashboardCard('Score Participants', 'Submit scores for competition participants', 'showScoringInterface')}
                ${this.createDashboardCard('View Criteria', 'Review judging criteria and guidelines', 'showCriteria')}
                ${this.createDashboardCard('Participants List', 'View all competition participants', 'showParticipants')}
                ${this.createDashboardCard('My Scores', 'Review and edit submitted scores', 'showMyScores')}
                ${this.createDashboardCard('Competition Progress', 'Track overall judging progress', 'showProgress')}
            </div>
        `;
    }

    createDashboardCard(title, description, action) {
        return `
            <div class="dashboard-card">
                <h3>${title}</h3>
                <p>${description}</p>
                <button onclick="judgeApp.${action}()" class="card-button">Manage</button>
            </div>
        `;
    }

    // Scoring Interface
    async showScoringInterface() {
        console.log('Showing scoring interface');
        const content = document.getElementById("content");
        if (!content) return;
        
        content.innerHTML = `
            <h2>Score Participants</h2>
            <div id="scoringContent"></div>
        `;
        
        this.showLoading('scoringContent');
        try {
            await this.renderParticipantSelection();
        } catch (error) {
            this.showError('scoringContent', 'Error loading participants');
        }
    }

    async renderParticipantSelection() {
        const container = document.getElementById("scoringContent");
        if (!container) return;

        if (!this.participants || this.participants.length === 0) {
            container.innerHTML = '<div class="empty-state">No participants available to score.</div>';
            return;
        }

        // Get existing scores for this judge
        try {
            const scores = await this.apiRequest(`/judge-scores/${this.judgeInfo.judge_id}/${this.currentCompetition.competition_id}`);
            const scoredIds = new Set(scores.map(s => s.participant_id));

            const html = `
                <div class="participant-selection">
                    <h3>Select a Participant to Score</h3>
                    <div class="participants-grid">
                        ${this.participants.map(p => `
                            <div class="participant-card" onclick="judgeApp.showScoringForm(${p.participant_id})">
                                <h4>${p.participant_name}</h4>
                                <p><strong>Age:</strong> ${p.age}</p>
                                <p><strong>Performance:</strong> ${p.performance_title || 'Not specified'}</p>
                                <div class="scoring-status">
                                    ${scoredIds.has(p.participant_id) ? 
                                        '<span class="status-indicator scored">✔️ Scored</span>' : 
                                        '<span class="status-indicator not-scored">Not Scored</span>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button onclick="judgeApp.showDashboard()" class="btn-secondary">Back to Dashboard</button>
                </div>
            `;

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading scores:', error);
            this.showError('scoringContent', 'Error loading scoring data');
        }
    }

    async showScoringForm(participantId) {
        console.log('Showing scoring form for participant:', participantId);
        this.currentParticipantId = participantId;
        
        const participant = this.participants.find(p => p.participant_id === participantId);
        if (!participant) {
            alert('Participant not found');
            return;
        }

        const content = document.getElementById("content");
        if (!content) return;

        content.innerHTML = `
            <h2>Score Participant - ${participant.participant_name}</h2>
            <div id="scoringFormContent"></div>
        `;

        this.showLoading('scoringFormContent');

        if (!this.criteria || this.criteria.length === 0) {
            this.showError('scoringFormContent', 'No judging criteria available for this competition');
            return;
        }

        const html = `
            <div class="scoring-form-container">
                <div class="participant-info-card">
                    <h3>Participant Information</h3>
                    <p><strong>Name:</strong> ${participant.participant_name}</p>
                    <p><strong>Age:</strong> ${participant.age}</p>
                    <p><strong>Performance:</strong> ${participant.performance_title || 'Not specified'}</p>
                    ${participant.performance_description ? `<p><strong>Description:</strong> ${participant.performance_description}</p>` : ''}
                </div>

                <form id="scoringForm" class="form-container">
                    <h3>Judging Criteria</h3>
                    ${this.criteria.map((criterion, index) => `
                        <div class="criterion-scoring">
                            <h4>${criterion.criteria_name} (${criterion.percentage}%)</h4>
                            <p>${criterion.description || ''}</p>
                            <label>Score (Max: ${criterion.max_score}):</label>
                            <input type="number" 
                                   id="score_${index}" 
                                   min="0" 
                                   max="${criterion.max_score}" 
                                   step="0.01" 
                                   required
                                   oninput="judgeApp.updateTotalScore()">
                        </div>
                    `).join('')}

                    <div class="total-score-display">
                        <h3>Total Score: <span id="totalScore">0.00</span></h3>
                    </div>

                    <label>Comments (Optional):</label>
                    <textarea id="comments" rows="4" placeholder="Add any comments about this participant's performance..."></textarea>

                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Submit Score</button>
                        <button type="button" onclick="judgeApp.showScoringInterface()" class="btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById("scoringFormContent").innerHTML = html;

        const form = document.getElementById("scoringForm");
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitScore();
            });
        }
    }

    updateTotalScore() {
        let total = 0;
        this.criteria.forEach((criterion, index) => {
            const scoreInput = document.getElementById(`score_${index}`);
            if (scoreInput && scoreInput.value) {
                const score = parseFloat(scoreInput.value);
                const weighted = (score / criterion.max_score) * criterion.percentage;
                total += weighted;
            }
        });
        
        const totalElement = document.getElementById('totalScore');
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
    }

    async submitScore() {
        const detailedScores = [];
        let totalScore = 0;

        this.criteria.forEach((criterion, index) => {
            const scoreInput = document.getElementById(`score_${index}`);
            const score = parseFloat(scoreInput.value);
            const weighted = (score / criterion.max_score) * criterion.percentage;
            
            detailedScores.push({
                criteria_id: criterion.criteria_id,
                criteria_name: criterion.criteria_name,
                score: score,
                max_score: criterion.max_score,
                percentage: criterion.percentage,
                weighted_score: weighted
            });
            
            totalScore += weighted;
        });

        const data = {
            judge_id: this.judgeInfo.judge_id,
            participant_id: this.currentParticipantId,
            competition_id: this.currentCompetition.competition_id,
            total_score: totalScore,
            detailed_scores: JSON.stringify(detailedScores),
            comments: document.getElementById('comments').value,
            scoring_date: new Date().toISOString()
        };

        this.showConfirmationModal(
            'Submit Score',
            'Are you sure you want to submit this score?',
            `Total Score: ${totalScore.toFixed(2)}`,
            'submit-score',
            async () => {
                try {
                    const result = await this.apiRequest('/submit-score', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });

                    if (result.success) {
                        this.showSuccessMessage('Score submitted successfully!');
                        this.showScoringInterface();
                    } else {
                        alert('Error: ' + (result.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Submit score error:', error);
                    alert('Error submitting score: ' + error.message);
                }
            }
        );
    }

    // View Criteria
    async showCriteria() {
        console.log('Showing criteria');
        const content = document.getElementById("content");
        if (!content) return;
        
        content.innerHTML = `
            <h2>Judging Criteria</h2>
            <div id="criteriaContent"></div>
        `;
        
        if (!this.criteria || this.criteria.length === 0) {
            document.getElementById("criteriaContent").innerHTML = `
                <div class="empty-state">No judging criteria set for this competition.</div>
                <div class="form-actions">
                    <button onclick="judgeApp.showDashboard()" class="btn-secondary">Back to Dashboard</button>
                </div>
            `;
            return;
        }

        const html = `
            <div class="criteria-list">
                ${this.criteria.map((criterion, index) => `
                    <div class="criterion-card">
                        <div class="criterion-header">
                            <h3>${index + 1}. ${criterion.criteria_name}</h3>
                            <span class="badge">${criterion.percentage}%</span>
                        </div>
                        <p><strong>Description:</strong> ${criterion.description || 'No description'}</p>
                        <p><strong>Maximum Score:</strong> ${criterion.max_score} points</p>
                    </div>
                `).join('')}
            </div>
            <div class="form-actions">
                <button onclick="judgeApp.showDashboard()" class="btn-secondary">Back to Dashboard</button>
            </div>
        `;

        document.getElementById("criteriaContent").innerHTML = html;
    }

    // View Participants
    async showParticipants() {
        console.log('Showing participants');
        const content = document.getElementById("content");
        if (!content) return;
        
        content.innerHTML = `
            <h2>Competition Participants</h2>
            <div id="participantsContent"></div>
        `;
        
        if (!this.participants || this.participants.length === 0) {
            document.getElementById("participantsContent").innerHTML = `
                <div class="empty-state">No participants registered yet.</div>
                <div class="form-actions">
                    <button onclick="judgeApp.showDashboard()" class="btn-secondary">Back to Dashboard</button>
                </div>
            `;
            return;
        }

        const html = `
            <table>
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Performance</th>
                    <th>Status</th>
                </tr>
                ${this.participants.map((p, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${p.participant_name}</strong></td>
                        <td>${p.age}</td>
                        <td>${p.gender}</td>
                        <td>${p.performance_title || 'Not specified'}</td>
                        <td>
                            <span class="status-badge status-${p.status}">
                                ${p.status.toUpperCase()}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </table>
            <div class="form-actions">
                <button onclick="judgeApp.showDashboard()" class="btn-secondary">Back to Dashboard</button>
            </div>
        `;

        document.getElementById("participantsContent").innerHTML = html;
    }

    // My Scores
    async showMyScores() {
        console.log('Showing my scores');
        const content = document.getElementById("content");
        if (!content) return;
        
        content.innerHTML = `
            <h2>My Submitted Scores</h2>
            <div id="myScoresContent"></div>
        `;
        
        this.showLoading('myScoresContent');
        try {
            const scores = await this.apiRequest(`/judge-scores/${this.judgeInfo.judge_id}/${this.currentCompetition.competition_id}`);
            this.renderMyScores(scores);
        } catch (error) {
            this.showError('myScoresContent', 'Error loading your scores');
        }
    }

    renderMyScores(scores) {
        const container = document.getElementById("myScoresContent");
        if (!container) return;

        if (!scores || scores.length === 0) {
            container.innerHTML = `
                <div class="empty-state">You haven't submitted any scores yet.</div>
                <div class="form-actions">
                    <button onclick="judgeApp.showDashboard()" class="btn-secondary">Back to Dashboard</button>
                </div>
            `;
            return;
        }

        const html = `
            <table>
                <tr>
                    <th>Participant</th>
                    <th>Total Score</th>
                    <th>Date Submitted</th>
                    <th>Comments</th>
                </tr>
                ${scores.map(score => `
                    <tr>
                        <td><strong>${score.participant_name}</strong></td>
                        <td>${score.total_score.toFixed(2)}</td>
                        <td>${new Date(score.scoring_date || score.created_at).toLocaleDateString()}</td>
                        <td>${score.comments || 'No comments'}</td>
                    </tr>
                `).join('')}
            </table>
            <div class="form-actions">
                <button onclick="judgeApp.showDashboard()" class="btn-secondary">Back to Dashboard</button>
            </div>
        `;

        container.innerHTML = html;
    }

    // Competition Progress
    async showProgress() {
        console.log('Showing progress');
        const content = document.getElementById("content");
        if (!content) return;
        
        content.innerHTML = `
            <h2>Competition Progress</h2>
            <div id="progressContent"></div>
        `;

        this.showLoading('progressContent');
        try {
            const [allScores, judges] = await Promise.all([
                this.apiRequest(`/overall-scores/${this.currentCompetition.competition_id}`),
                this.apiRequest(`/competition-judges/${this.currentCompetition.competition_id}`)
            ]);
            
            this.renderProgress(allScores, judges);
        } catch (error) {
            this.showError('progressContent', 'Error loading progress data');
        }
    }

    renderProgress(allScores, judges) {
        const progressMatrix = {};
        
        this.participants.forEach(participant => {
            progressMatrix[participant.participant_id] = {
                name: participant.participant_name,
                judges: {}
            };
        });

        judges.forEach(judge => {
            this.participants.forEach(participant => {
                progressMatrix[participant.participant_id].judges[judge.judge_id] = {
                    judge_name: judge.judge_name,
                    scored: false
                };
            });
        });

        allScores.forEach(score => {
            if (progressMatrix[score.participant_id] && progressMatrix[score.participant_id].judges[score.judge_id]) {
                progressMatrix[score.participant_id].judges[score.judge_id].scored = true;
            }
        });

        const totalSlots = this.participants.length * judges.length;
        const completedSlots = allScores.length;
        const overallProgress = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

        const html = `
            <div class="progress-overview">
                <h3>Overall Competition Progress</h3>
                <div class="progress-stats">
                    <p><strong>Total Judges:</strong> ${judges.length}</p>
                    <p><strong>Total Participants:</strong> ${this.participants.length}</p>
                    <p><strong>Total Scores Submitted:</strong> ${completedSlots}/${totalSlots}</p>
                    <p><strong>Overall Progress:</strong> ${overallProgress}%</p>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${overallProgress}%;"></div>
                </div>
            </div>

            <div class="participant-matrix">
                <h3>Scoring Progress Matrix</h3>
                <table class="matrix-table">
                    <thead>
                        <tr>
                            <th>Participant</th>
                            ${judges.map(j => `<th>${j.judge_name}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${this.participants.map(p => `
                            <tr>
                                <td><strong>${p.participant_name}</strong></td>
                                ${judges.map(j => {
                                    const cell = progressMatrix[p.participant_id].judges[j.judge_id];
                                    return `<td class="${cell.scored ? 'scored' : 'not-scored'}">
                                        ${cell.scored ? '✔️' : '❌'}
                                    </td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="form-actions">
                <button onclick="judgeApp.showDashboard()" class="btn-secondary">Back to Dashboard</button>
            </div>
        `;

        document.getElementById("progressContent").innerHTML = html;
    }
}

// Initialize the judge dashboard
const judgeApp = new JudgeDashboard();

// Global functions for backwards compatibility
window.showDashboard = () => judgeApp.showDashboard();
window.showScoringInterface = () => judgeApp.showScoringInterface();
window.showCriteria = () => judgeApp.showCriteria();
window.showParticipants = () => judgeApp.showParticipants();
window.showMyScores = () => judgeApp.showMyScores();
window.showProgress = () => judgeApp.showProgress();

// Make sure all judge functions are globally accessible
window.judgeApp = judgeApp;
