// Staff Dashboard - Complete Implementation
class StaffDashboard {
    constructor() {
        this.baseURL = 'http://localhost:3002';
        this.user = null;
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
        if (!this.user || this.user.role !== 'staff') {
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
                <div style="font-size: 12px;">Role: Staff Member</div>
                <button onclick="staffApp.logout()" class="logout-btn">Logout</button>
            `;
        }
    }

    logout() {
        sessionStorage.removeItem('user');
        window.location.href = 'login.html';
    }

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
            <h2></h2>
            <div class="dashboard-grid">
                ${this.createDashboardCard('Competitions', 'View and monitor competitions', 'showCompetitions')}
                ${this.createDashboardCard('Participants', 'Manage participant registrations', 'showParticipants')}
                ${this.createDashboardCard('Judges', 'View judge assignments', 'showJudges')}
                ${this.createDashboardCard('Live Scoring', 'Monitor live competition scoring', 'showLiveScoring')}
                ${this.createDashboardCard('Competition Results', 'View current rankings and results', 'showResults')}
                ${this.createDashboardCard('Event Status', 'Track competition progress', 'showEventStatus')}
            </div>
        `;
    }

    createDashboardCard(title, description, action) {
        return `
            <div class="dashboard-card">
                <h3>${title}</h3>
                <p>${description}</p>
                <button onclick="staffApp.${action}()" class="card-button">View</button>
            </div>
        `;
    }

    // Competitions Management
    async showCompetitions() {
        document.getElementById("content").innerHTML = `
            <h2>Competition Overview</h2>
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
                    <div class="dashboard-card competition-card">
                        <h3>${competition.competition_name} 
                            <span class="badge ${competition.is_pageant ? 'badge-pageant' : 'badge-regular'}">
                                ${competition.is_pageant ? 'PAGEANT' : 'REGULAR'}
                            </span>
                        </h3>
                        <div class="competition-details">
                            <p><strong>Type:</strong> ${competition.type_name}</p>
                            <p><strong>Date:</strong> ${new Date(competition.competition_date).toLocaleDateString()}</p>
                            <p><strong>Participants:</strong> ${competition.participant_count || 0}</p>
                            <p><strong>Judges:</strong> ${competition.judge_count || 0}</p>
                            <p><strong>Status:</strong> <span class="status-ongoing">Ongoing</span></p>
                        </div>
                        <div class="card-actions">
                            <button onclick="staffApp.viewCompetitionDetails(${competition.competition_id})" class="btn-primary">View Details</button>
                            <button onclick="staffApp.viewCompetitionResults(${competition.competition_id})" class="btn-secondary">Results</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="empty-state">No competitions found.</div>';

        document.getElementById("competitionsList").innerHTML = html;
    }

    async viewCompetitionDetails(competitionId) {
        document.getElementById("content").innerHTML = `
            <h2>Competition Details</h2>
            <div id="competitionDetails"></div>
        `;

        this.showLoading('competitionDetails');
        try {
            const [competition, participants, judges, criteria] = await Promise.all([
                this.apiRequest(`/competition/${competitionId}`),
                this.apiRequest(`/competition-participants/${competitionId}`),
                this.apiRequest(`/competition-judges/${competitionId}`),
                this.apiRequest(`/competition-criteria/${competitionId}`)
            ]);

            this.renderCompetitionDetails(competition, participants, judges, criteria);
        } catch (error) {
            this.showError('competitionDetails', 'Error loading competition details');
        }
    }

    renderCompetitionDetails(competition, participants, judges, criteria) {
        const html = `
            <div class="competition-detail-container">
                <div class="competition-header">
                    <h3>${competition.competition_name}</h3>
                    <span class="badge ${competition.is_pageant ? 'badge-pageant' : 'badge-regular'}">
                        ${competition.is_pageant ? 'PAGEANT EVENT' : 'REGULAR EVENT'}
                    </span>
                </div>
                
                <div class="detail-section">
                    <h4>Competition Information</h4>
                    <p><strong>Type:</strong> ${competition.type_name}</p>
                    <p><strong>Date:</strong> ${new Date(competition.competition_date).toLocaleDateString()}</p>
                    <p><strong>Description:</strong> ${competition.event_description || 'No description available'}</p>
                </div>

                <div class="detail-grid">
                    <div class="detail-section">
                        <h4>Participants (${participants.length})</h4>
                        ${participants.length ? `
                            <ul class="participant-list">
                                ${participants.map(p => `
                                    <li>
                                        <strong>${p.participant_name}</strong> (Age: ${p.age})
                                        <br><small>Performance: ${p.performance_title || 'N/A'}</small>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p>No participants registered yet.</p>'}
                    </div>

                    <div class="detail-section">
                        <h4>Assigned Judges (${judges.length})</h4>
                        ${judges.length ? `
                            <ul class="judge-list">
                                ${judges.map(j => `
                                    <li>
                                        <strong>${j.judge_name}</strong>
                                        <br><small>Expertise: ${j.expertise}</small>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p>No judges assigned yet.</p>'}
                    </div>

                    <div class="detail-section">
                        <h4>Judging Criteria (${criteria.length})</h4>
                        ${criteria.length ? `
                            <ul class="criteria-list">
                                ${criteria.map(c => `
                                    <li>
                                        <strong>${c.criteria_name}</strong> (${c.percentage}%)
                                        <br><small>Max Score: ${c.max_score} points</small>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p>No criteria set yet.</p>'}
                    </div>
                </div>

                <div class="form-actions">
                    <button onclick="staffApp.showCompetitions()" class="btn-secondary">Back to Competitions</button>
                </div>
            </div>
        `;

        document.getElementById("competitionDetails").innerHTML = html;
    }

    // Participants Management
    async showParticipants() {
        document.getElementById("content").innerHTML = `
            <h2>Participant Management</h2>
            <button onclick="staffApp.showAddParticipantForm()" class="card-button">Register New Participant</button>
            <div id="participantsList"></div>
        `;

        this.showLoading('participantsList');
        try {
            const participants = await this.apiRequest('/participants');
            this.renderParticipants(participants);
        } catch (error) {
            this.showError('participantsList', 'Error loading participants');
        }
    }

    renderParticipants(participants) {
        const html = participants.length ? `
            <div class="participants-grid">
                ${participants.map(participant => `
                    <div class="dashboard-card participant-card">
                        <h3>${participant.participant_name}</h3>
                        <div class="participant-details">
                            <p><strong>Age:</strong> ${participant.age}</p>
                            <p><strong>Gender:</strong> ${participant.gender}</p>
                            <p><strong>Competition:</strong> ${participant.competition_name}</p>
                            <p><strong>Performance:</strong> ${participant.performance_title || 'N/A'}</p>
                            <p><strong>Status:</strong> 
                                <span class="status-${participant.status}">${participant.status.toUpperCase()}</span>
                            </p>
                        </div>
                        <div class="card-actions">
                            <button onclick="staffApp.viewParticipantDetails(${participant.participant_id})" class="btn-primary">View Details</button>
                            <button onclick="staffApp.updateParticipantStatus(${participant.participant_id})" class="btn-secondary">Update Status</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="empty-state">No participants found.</div>';

        document.getElementById("participantsList").innerHTML = html;
    }

    async viewParticipantDetails(participantId) {
        try {
            const participant = await this.apiRequest(`/participant/${participantId}`);
            this.showParticipantModal(participant);
        } catch (error) {
            alert('Error loading participant details');
        }
    }

    showParticipantModal(participant) {
        const modalHtml = `
            <div class="modal-overlay" onclick="staffApp.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <h3>Participant Details</h3>
                    <div class="participant-modal-details">
                        <p><strong>Name:</strong> ${participant.participant_name}</p>
                        <p><strong>Email:</strong> ${participant.email}</p>
                        <p><strong>Phone:</strong> ${participant.phone || 'N/A'}</p>
                        <p><strong>Age:</strong> ${participant.age}</p>
                        <p><strong>Gender:</strong> ${participant.gender}</p>
                        <p><strong>School/Organization:</strong> ${participant.school_organization || 'N/A'}</p>
                        <p><strong>Competition:</strong> ${participant.competition_name}</p>
                        <p><strong>Performance Title:</strong> ${participant.performance_title || 'N/A'}</p>
                        <p><strong>Performance Description:</strong> ${participant.performance_description || 'N/A'}</p>
                        <p><strong>Registration Status:</strong> 
                            <span class="status-${participant.status}">${participant.status.toUpperCase()}</span>
                        </p>
                        ${participant.height ? `<p><strong>Height:</strong> ${participant.height}</p>` : ''}
                        ${participant.measurements ? `<p><strong>Measurements:</strong> ${participant.measurements}</p>` : ''}
                        ${participant.talents ? `<p><strong>Special Talents:</strong> ${participant.talents}</p>` : ''}
                        ${participant.special_awards ? `<p><strong>Awards:</strong> ${participant.special_awards}</p>` : ''}
                    </div>
                    <button onclick="staffApp.closeModal()" class="btn-secondary">Close</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    // Live Scoring Monitor
    async showLiveScoring() {
        document.getElementById("content").innerHTML = `
            <h2>Live Scoring Monitor</h2>
            <div class="form-group">
                <label>Select Competition to Monitor:</label>
                <select id="liveScoringCompetition" onchange="staffApp.loadLiveScores()">
                    <option value="">Choose Competition</option>
                </select>
            </div>
            <div id="liveScoringContent">
                <div class="empty-state">Select a competition to monitor live scoring</div>
            </div>
        `;

        try {
            const competitions = await this.apiRequest('/competitions');
            const select = document.getElementById("liveScoringCompetition");
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

    async loadLiveScores() {
        const competitionId = document.getElementById("liveScoringCompetition").value;
        if (!competitionId) return;

        this.showLoading('liveScoringContent');
        try {
            const [scores, participants, judges] = await Promise.all([
                this.apiRequest(`/live-scores/${competitionId}`),
                this.apiRequest(`/competition-participants/${competitionId}`),
                this.apiRequest(`/competition-judges/${competitionId}`)
            ]);

            this.renderLiveScoring(scores, participants, judges);
            
            // Auto-refresh every 10 seconds
            if (this.liveRefreshInterval) {
                clearInterval(this.liveRefreshInterval);
            }
            this.liveRefreshInterval = setInterval(() => {
                if (document.getElementById("liveScoringCompetition").value === competitionId) {
                    this.loadLiveScores();
                }
            }, 10000);
            
        } catch (error) {
            this.showError('liveScoringContent', 'Error loading live scores');
        }
    }

    renderLiveScoring(scores, participants, judges) {
        // Create a matrix showing which judges have scored which participants
        const scoringMatrix = {};
        
        participants.forEach(participant => {
            scoringMatrix[participant.participant_id] = {
                name: participant.participant_name,
                scores: {}
            };
        });

        judges.forEach(judge => {
            participants.forEach(participant => {
                scoringMatrix[participant.participant_id].scores[judge.judge_id] = {
                    judge_name: judge.judge_name,
                    scored: false,
                    score: 0
                };
            });
        });

        // Fill in actual scores
        scores.forEach(score => {
            if (scoringMatrix[score.participant_id] && scoringMatrix[score.participant_id].scores[score.judge_id]) {
                scoringMatrix[score.participant_id].scores[score.judge_id].scored = true;
                scoringMatrix[score.participant_id].scores[score.judge_id].score = score.total_score;
            }
        });

        const html = `
            <div class="live-scoring-container">
                <div class="scoring-status">
                    <h3>Scoring Progress</h3>
                    <p>Last updated: ${new Date().toLocaleTimeString()}</p>
                    <div class="auto-refresh-indicator">🔄 Auto-refreshing every 10 seconds</div>
                </div>

                <div class="scoring-matrix">
                    <table class="live-scoring-table">
                        <thead>
                            <tr>
                                <th>Participant</th>
                                ${judges.map(judge => `<th>${judge.judge_name}</th>`).join('')}
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.values(scoringMatrix).map(participant => {
                                const scoredCount = Object.values(participant.scores).filter(s => s.scored).length;
                                const totalJudges = judges.length;
                                const percentage = totalJudges > 0 ? Math.round((scoredCount / totalJudges) * 100) : 0;
                                
                                return `
                                    <tr>
                                        <td><strong>${participant.name}</strong></td>
                                        ${judges.map(judge => {
                                            const score = participant.scores[judge.judge_id];
                                            return `
                                                <td class="score-cell ${score.scored ? 'scored' : 'not-scored'}">
                                                    ${score.scored ? score.score.toFixed(1) : '—'}
                                                </td>
                                            `;
                                        }).join('')}
                                        <td>
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${percentage}%"></div>
                                                <span class="progress-text">${scoredCount}/${totalJudges}</span>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="scoring-legend">
                    <div class="legend-item">
                        <span class="legend-color scored"></span> Score Submitted
                    </div>
                    <div class="legend-item">
                        <span class="legend-color not-scored"></span> Pending Score
                    </div>
                </div>
            </div>
        `;

        document.getElementById("liveScoringContent").innerHTML = html;
    }

    // Results View
    async showResults() {
        document.getElementById("content").innerHTML = `
            <h2>Competition Results</h2>
            <div class="form-group">
                <label>Select Competition:</label>
                <select id="resultsCompetition" onchange="staffApp.loadResults()">
                    <option value="">Choose Competition</option>
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

    async loadResults() {
        const competitionId = document.getElementById("resultsCompetition").value;
        if (!competitionId) return;

        this.showLoading('resultsContent');
        try {
            const scores = await this.apiRequest(`/overall-scores/${competitionId}`);
            this.renderResults(scores);
        } catch (error) {
            this.showError('resultsContent', 'Error loading results');
        }
    }

    renderResults(scores) {
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
            <div class="results-container">
                <div class="results-header">
                    <h3>Current Rankings</h3>
                    <p>Based on ${scores.length} submitted scores</p>
                </div>

                <div class="results-table">
                    <table>
                        <tr>
                            <th>Rank</th>
                            <th>Participant</th>
                            <th>Average Score</th>
                            <th>Judges Scored</th>
                            <th>Status</th>
                        </tr>
                        ${sortedParticipants.map((participant, index) => `
                            <tr class="rank-row-${index + 1}">
                                <td class="rank-${index + 1}">${this.getRankText(index)}</td>
                                <td><strong>${participant.participant_name}</strong></td>
                                <td class="score-cell">${participant.average.toFixed(2)}</td>
                                <td>${participant.scores.length}</td>
                                <td>
                                    <span class="status-indicator ${participant.scores.length >= 3 ? 'complete' : 'incomplete'}">
                                        ${participant.scores.length >= 3 ? 'Complete' : 'In Progress'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>

                <div class="results-summary">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <span class="stat-number">${sortedParticipants.length}</span>
                            <span class="stat-label">Participants</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${scores.length}</span>
                            <span class="stat-label">Total Scores</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${sortedParticipants.filter(p => p.scores.length >= 3).length}</span>
                            <span class="stat-label">Completed</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("resultsContent").innerHTML = html;
    }

    getRankText(index) {
        const ranks = ['1st', '2nd', '3rd'];
        return ranks[index] || `${index + 1}th`;
    }

    // Event Status Monitor
    async showEventStatus() {
        document.getElementById("content").innerHTML = `
            <h2>Event Status Monitor</h2>
            <div id="eventStatusContent"></div>
        `;

        this.showLoading('eventStatusContent');
        try {
            const competitions = await this.apiRequest('/competitions');
            this.renderEventStatus(competitions);
        } catch (error) {
            this.showError('eventStatusContent', 'Error loading event status');
        }
    }

    renderEventStatus(competitions) {
        const html = `
            <div class="event-status-container">
                <div class="status-overview">
                    <h3>Event Status Overview</h3>
                    <div class="status-grid">
                        ${competitions.map(competition => `
                            <div class="status-card">
                                <h4>${competition.competition_name}</h4>
                                <div class="status-details">
                                    <div class="status-item">
                                        <span class="status-label">Participants:</span>
                                        <span class="status-value">${competition.participant_count || 0}</span>
                                    </div>
                                    <div class="status-item">
                                        <span class="status-label">Judges:</span>
                                        <span class="status-value">${competition.judge_count || 0}</span>
                                    </div>
                                    <div class="status-item">
                                        <span class="status-label">Date:</span>
                                        <span class="status-value">${new Date(competition.competition_date).toLocaleDateString()}</span>
                                    </div>
                                    <div class="status-item">
                                        <span class="status-label">Status:</span>
                                        <span class="status-badge ${this.getStatusClass(competition)}">
                                            ${this.getStatusText(competition)}
                                        </span>
                                    </div>
                                </div>
                                <div class="progress-indicator">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${this.calculateProgress(competition)}%"></div>
                                    </div>
                                    <span class="progress-text">${this.calculateProgress(competition)}% Ready</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.getElementById("eventStatusContent").innerHTML = html;
    }

    getStatusClass(competition) {
        const participants = competition.participant_count || 0;
        const judges = competition.judge_count || 0;
        
        if (participants >= 3 && judges >= 2) return 'status-ready';
        if (participants >= 1 && judges >= 1) return 'status-preparing';
        return 'status-setup';
    }

    getStatusText(competition) {
        const participants = competition.participant_count || 0;
        const judges = competition.judge_count || 0;
        
        if (participants >= 3 && judges >= 2) return 'Ready';
        if (participants >= 1 && judges >= 1) return 'Preparing';
        return 'Setup Required';
    }

    calculateProgress(competition) {
        const participants = competition.participant_count || 0;
        const judges = competition.judge_count || 0;
        
        let progress = 0;
        if (participants >= 1) progress += 30;
        if (participants >= 3) progress += 20;
        if (judges >= 1) progress += 30;
        if (judges >= 2) progress += 20;
        
        return Math.min(progress, 100);
    }

    // Judges View
    async showJudges() {
        document.getElementById("content").innerHTML = `
            <h2>Judge Overview</h2>
            <div id="judgesList"></div>
        `;

        this.showLoading('judgesList');
        try {
            const judges = await this.apiRequest('/judges');
            this.renderJudges(judges);
        } catch (error) {
            this.showError('judgesList', 'Error loading judges');
        }
    }

    renderJudges(judges) {
        const html = judges.length ? `
            <div class="judges-grid">
                ${judges.map(judge => `
                    <div class="dashboard-card judge-card">
                        <h3>${judge.judge_name}</h3>
                        <div class="judge-details">
                            <p><strong>Email:</strong> ${judge.email}</p>
                            <p><strong>Expertise:</strong> ${judge.expertise}</p>
                            <p><strong>Experience:</strong> ${judge.experience_years} years</p>
                            <p><strong>Competition:</strong> ${judge.competition_name || 'Not assigned'}</p>
                            <p><strong>Username:</strong> ${judge.username || 'N/A'}</p>
                        </div>
                        <div class="judge-status">
                            <span class="status-badge ${judge.competition_name ? 'status-assigned' : 'status-unassigned'}">
                                ${judge.competition_name ? 'Assigned' : 'Available'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="empty-state">No judges found.</div>';

        document.getElementById("judgesList").innerHTML = html;
    }

    // Add Participant Form
    showAddParticipantForm() {
        document.getElementById("content").innerHTML = `
            <h2>Register New Participant</h2>
            <form id="participantForm" class="form-container">
                <h3>Basic Information</h3>
                <div class="grid-2">
                    <div>
                        <label>Participant Name:</label>
                        <input type="text" id="participant_name" required>
                    </div>
                    <div>
                        <label>Email Address:</label>
                        <input type="email" id="email" required>
                    </div>
                </div>
                
                <div class="grid-3">
                    <div>
                        <label>Phone Number:</label>
                        <input type="tel" id="phone">
                    </div>
                    <div>
                        <label>Age:</label>
                        <input type="number" id="age" min="1" max="120" required>
                    </div>
                    <div>
                        <label>Gender:</label>
                        <select id="gender" required>
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                
                <label>School/Organization:</label>
                <input type="text" id="school_organization">
                
                <h3>Competition Details</h3>
                <label>Select Competition:</label>
                <select id="competition" required onchange="staffApp.handleCompetitionChange()">
                    <option value="">Choose Competition</option>
                </select>
                
                <div id="competitionInfo" class="hidden"></div>
                
                <div class="grid-2">
                    <div>
                        <label>Performance/Entry Title:</label>
                        <input type="text" id="performance_title">
                    </div>
                    <div>
                        <label>Registration Status:</label>
                        <select id="status" required>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="waived">Waived</option>
                        </select>
                    </div>
                </div>
                
                <label>Performance Description:</label>
                <textarea id="performance_description" rows="3"></textarea>
                
                <div id="pageantSection" class="hidden">
                    <h3>Beauty Pageant Information</h3>
                    <div class="grid-2">
                        <div>
                            <label>Height:</label>
                            <input type="text" id="height" placeholder="e.g., 5'6\" or 168cm">
                        </div>
                        <div>
                            <label>Measurements:</label>
                            <input type="text" id="measurements" placeholder="e.g., 34-24-36">
                        </div>
                    </div>
                    
                    <label>Special Talents & Skills:</label>
                    <textarea id="talents" rows="3"></textarea>
                    
                    <label>Awards & Achievements:</label>
                    <textarea id="special_awards" rows="3"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Register Participant</button>
                    <button type="button" onclick="staffApp.showParticipants()" class="btn-secondary">Cancel</button>
                </div>
            </form>
        `;

        this.loadCompetitionsForParticipantForm();
        document.getElementById("participantForm").onsubmit = async (e) => {
            e.preventDefault();
            await this.createParticipant();
        };
    }

    async loadCompetitionsForParticipantForm() {
        try {
            const competitions = await this.apiRequest('/competitions');
            const select = document.getElementById("competition");
            competitions.forEach(competition => {
                const option = document.createElement("option");
                option.value = competition.competition_id;
                option.setAttribute('data-is-pageant', competition.is_pageant);
                option.setAttribute('data-type-name', competition.type_name);
                option.textContent = `${competition.competition_name} (${competition.type_name})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading competitions:', error);
        }
    }

    handleCompetitionChange() {
        const select = document.getElementById("competition");
        const selectedOption = select.options[select.selectedIndex];
        
        if (select.value) {
            const isPageant = selectedOption.getAttribute('data-is-pageant') === '1';
            const typeName = selectedOption.getAttribute('data-type-name');
            
            document.getElementById("pageantSection").className = isPageant ? '' : 'hidden';
            document.getElementById("competitionInfo").className = '';
            document.getElementById("competitionInfo").innerHTML = `
                <div class="alert alert-info">
                    <strong>Competition Type:</strong> ${typeName} ${isPageant ? '(Beauty Pageant)' : '(Regular Event)'}
                </div>
            `;
        } else {
            document.getElementById("pageantSection").className = 'hidden';
            document.getElementById("competitionInfo").className = 'hidden';
        }
    }

    async createParticipant() {
        const data = {
            participant_name: document.getElementById("participant_name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            age: document.getElementById("age").value,
            gender: document.getElementById("gender").value,
            school_organization: document.getElementById("school_organization").value,
            performance_title: document.getElementById("performance_title").value,
            performance_description: document.getElementById("performance_description").value,
            competition_id: document.getElementById("competition").value,
            status: document.getElementById("status").value,
            height: document.getElementById("height").value,
            measurements: document.getElementById("measurements").value,
            talents: document.getElementById("talents").value,
            special_awards: document.getElementById("special_awards").value
        };

        try {
            const result = await this.apiRequest('/add-participant', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (result.success) {
                alert('Participant registered successfully!');
                this.showParticipants();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error registering participant');
        }
    }

    // Additional methods for competition details
    async viewCompetitionResults(competitionId) {
        try {
            const scores = await this.apiRequest(`/overall-scores/${competitionId}`);
            this.showCompetitionResultsModal(scores, competitionId);
        } catch (error) {
            alert('Error loading competition results');
        }
    }

    showCompetitionResultsModal(scores, competitionId) {
        if (scores.length === 0) {
            alert('No scores available for this competition yet.');
            return;
        }

        // Process scores same as in renderResults
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

        const sortedParticipants = Object.values(participantScores)
            .map(participant => {
                participant.average = participant.scores.reduce((a, b) => a + b, 0) / participant.scores.length;
                return participant;
            })
            .sort((a, b) => b.average - a.average);

        const modalHtml = `
            <div class="modal-overlay" onclick="staffApp.closeModal()">
                <div class="modal-content large-modal" onclick="event.stopPropagation()">
                    <h3>Competition Results</h3>
                    <div class="results-table">
                        <table>
                            <tr>
                                <th>Rank</th>
                                <th>Participant</th>
                                <th>Average Score</th>
                                <th>Judges</th>
                            </tr>
                            ${sortedParticipants.map((participant, index) => `
                                <tr>
                                    <td class="rank-${index + 1}">${this.getRankText(index)}</td>
                                    <td><strong>${participant.participant_name}</strong></td>
                                    <td>${participant.average.toFixed(2)}</td>
                                    <td>${participant.scores.length}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                    <button onclick="staffApp.closeModal()" class="btn-secondary">Close</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async updateParticipantStatus(participantId) {
        const newStatus = prompt('Enter new status (pending/paid/waived):');
        if (newStatus && ['pending', 'paid', 'waived'].includes(newStatus.toLowerCase())) {
            try {
                const result = await this.apiRequest(`/update-participant-status/${participantId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: newStatus.toLowerCase() })
                });

                if (result.success) {
                    alert('Participant status updated successfully!');
                    this.showParticipants();
                } else {
                    alert('Error updating participant status');
                }
            } catch (error) {
                alert('Error updating participant status');
            }
        } else if (newStatus) {
            alert('Invalid status. Use: pending, paid, or waived');
        }
    }

    // Cleanup method
    destroy() {
        if (this.liveRefreshInterval) {
            clearInterval(this.liveRefreshInterval);
        }
    }
}

// Initialize the staff dashboard
const staffApp = new StaffDashboard();

// Clean up on page unload
window.addEventListener('beforeunload', () => { 
    if (staffApp.liveRefreshInterval) {
        clearInterval(staffApp.liveRefreshInterval);
    }
});
