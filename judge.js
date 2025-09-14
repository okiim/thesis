// Judge Dashboard - Complete Implementation
class JudgeDashboard {
    constructor() {
        this.baseURL = 'http://localhost:3002';
        this.user = null;
        this.judgeInfo = null;
        this.currentCompetition = null;
        this.criteria = [];
        this.participants = [];
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthentication();
            this.loadJudgeInfo();
        });
    }

    checkAuthentication() {
        this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
        if (!this.user || this.user.role !== 'judge') {
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
                <div style="font-size: 12px;">Role: Judge</div>
                <button onclick="judgeApp.logout()" class="logout-btn">Logout</button>
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
            
            this.criteria = criteria;
            this.participants = participants;
        } catch (error) {
            console.error('Error loading competition data:', error);
        }
    }

    showDashboard() {
        if (!this.currentCompetition) {
            document.getElementById("content").innerHTML = `
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

        document.getElementById("content").innerHTML = `
            <h2>Judge Dashboard - ${this.currentCompetition.competition_name}</h2>
            
            <div class="competition-info-banner">
                <div class="competition-details">
                    <h3>${this.currentCompetition.competition_name}</h3>
                    <p><strong>Type:</strong> ${this.currentCompetition.type_name}</p>
                    <p><strong>Date:</strong> ${new Date(this.currentCompetition.competition_date).toLocaleDateString()}</p>
                    <span class="badge ${this.currentCompetition.is_pageant ? 'badge-pageant' : 'badge-regular'}">
                        ${this.currentCompetition.is_pageant ? 'PAGEANT EVENT' : 'REGULAR EVENT'}
                    </span>
                </div>
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
                <button onclick="judgeApp.${action}()" class="card-button">Open</button>
            </div>
        `;
    }

    // ========== (Scoring, Criteria, Participants, MyScores code here - unchanged from your version) ==========

    // Show Progress
    async showProgress() {
        document.getElementById("content").innerHTML = `
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
            <div class="progress-container">
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

                <div class="judge-progress">
                    <h3>Judge Scoring Progress</h3>
                    <table class="progress-table">
                        <thead>
                            <tr>
                                <th>Judge</th>
                                <th>Scores Submitted</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${judges.map(judge => {
                                const judgeScores = allScores.filter(s => s.judge_id === judge.judge_id);
                                const judgeProgress = this.participants.length > 0
                                    ? Math.round((judgeScores.length / this.participants.length) * 100)
                                    : 0;
                                return `
                                    <tr>
                                        <td>${judge.judge_name}</td>
                                        <td>${judgeScores.length}/${this.participants.length}</td>
                                        <td>
                                            <div class="progress-bar small">
                                                <div class="progress-fill" style="width:${judgeProgress}%;"></div>
                                            </div>
                                            <span>${judgeProgress}%</span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="participant-matrix">
                    <h3>Participant Scoring Matrix</h3>
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
                                    <td>${p.participant_name}</td>
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
            </div>
        `;

        document.getElementById("progressContent").innerHTML = html;
    }
}

// Instantiate the app
const judgeApp = new JudgeDashboard();
