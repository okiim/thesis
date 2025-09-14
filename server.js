const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const port = 3002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '')));

// Enhanced MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'enverga_judging_system',  // Updated database name
    multipleStatements: true
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to Enhanced MySQL database');
});

// Generate random password
function generatePassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// ================================================
// STATIC FILE SERVING
// ================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/staff-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'staff-dashboard.html'));
});

app.get('/judge-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'judge-dashboard.html'));
});

// ================================================
// AUTHENTICATION ENDPOINTS
// ================================================
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, result) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result[0];
        console.log('Login successful:', user.username, 'Role:', user.role);
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                user_id: user.user_id,
                username: user.username,
                role: user.role,
                full_name: user.full_name || user.username
            }
        });
    });
});

// ================================================
// EVENT TYPES ENDPOINTS
// ================================================
app.get('/event-types', (req, res) => {
    const sql = 'SELECT * FROM event_types ORDER BY type_name';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching event types:', err);
            return res.status(500).json({ error: 'Error fetching event types' });
        }
        res.json(result);
    });
});

app.post('/create-event-type', (req, res) => {
    const { type_name, description, is_pageant } = req.body;
    
    if (!type_name) {
        return res.status(400).json({ error: 'Event type name is required' });
    }

    const sql = 'INSERT INTO event_types (type_name, description, is_pageant) VALUES (?, ?, ?)';
    db.query(sql, [type_name, description || null, is_pageant || false], (err, result) => {
        if (err) {
            console.error('Error creating event type:', err);
            return res.status(500).json({ error: 'Error creating event type' });
        }
        res.json({ 
            success: true, 
            message: 'Event type created successfully!',
            event_type_id: result.insertId 
        });
    });
});

app.delete('/delete-event-type/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM event_types WHERE event_type_id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting event type:', err);
            return res.status(500).json({ error: 'Error deleting event type' });
        }
        res.json({ success: true, message: 'Event type deleted successfully!' });
    });
});

// ================================================
// ENHANCED COMPETITION ENDPOINTS
// ================================================
app.get('/competitions', (req, res) => {
    const sql = `
        SELECT c.*, et.type_name, et.is_pageant,
               COUNT(DISTINCT p.participant_id) as participant_count,
               COUNT(DISTINCT j.judge_id) as judge_count
        FROM competitions c
        JOIN event_types et ON c.event_type_id = et.event_type_id
        LEFT JOIN participants p ON c.competition_id = p.competition_id
        LEFT JOIN judges j ON c.competition_id = j.competition_id
        GROUP BY c.competition_id, c.competition_name, c.competition_date, c.event_description, et.type_name, et.is_pageant
        ORDER BY c.competition_date DESC
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching competitions:', err);
            return res.status(500).json({ error: 'Error fetching competitions' });
        }
        res.json(result);
    });
});

app.get('/competition/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT c.*, et.type_name, et.is_pageant
        FROM competitions c
        JOIN event_types et ON c.event_type_id = et.event_type_id
        WHERE c.competition_id = ?
    `;
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching competition' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        res.json(result[0]);
    });
});

app.get('/competition-participants/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM participants WHERE competition_id = ? ORDER BY participant_name';
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching participants' });
        }
        res.json(result);
    });
});

app.get('/competition-judges/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM judges WHERE competition_id = ? ORDER BY judge_name';
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching judges' });
        }
        res.json(result);
    });
});

app.post('/create-competition', (req, res) => {
    const { competition_name, event_type_id, competition_date, event_description } = req.body;
    
    if (!competition_name || !event_type_id || !competition_date) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const sql = 'INSERT INTO competitions (competition_name, event_type_id, competition_date, event_description) VALUES (?, ?, ?, ?)';
    db.query(sql, [competition_name, event_type_id, competition_date, event_description], (err, result) => {
        if (err) {
            console.error('Error creating competition:', err);
            return res.status(500).json({ error: 'Error creating competition' });
        }
        res.json({ 
            success: true, 
            message: 'Competition created successfully!',
            competition_id: result.insertId 
        });
    });
});

app.put('/update-competition/:id', (req, res) => {
    const { id } = req.params;
    const { competition_name, event_type_id, competition_date, event_description } = req.body;
    
    if (!competition_name || !event_type_id || !competition_date) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const sql = `UPDATE competitions 
                 SET competition_name = ?, event_type_id = ?, competition_date = ?, event_description = ?
                 WHERE competition_id = ?`;
                 
    db.query(sql, [competition_name, event_type_id, competition_date, event_description, id], (err, result) => {
        if (err) {
            console.error('Error updating competition:', err);
            return res.status(500).json({ error: 'Error updating competition' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Competition updated successfully!'
        });
    });
});

app.delete('/delete-competition/:id', (req, res) => {
    const { id } = req.params;
    
    // Delete in order due to foreign key constraints
    const deleteQueries = [
        'DELETE FROM detailed_scores WHERE competition_id = ?',
        'DELETE FROM overall_scores WHERE competition_id = ?',
        'DELETE FROM competition_criteria WHERE competition_id = ?',
        'UPDATE judges SET competition_id = NULL WHERE competition_id = ?',
        'DELETE FROM participants WHERE competition_id = ?',
        'DELETE FROM competitions WHERE competition_id = ?'
    ];
    
    let completedQueries = 0;
    
    deleteQueries.forEach((query, index) => {
        db.query(query, [id], (err) => {
            if (err) {
                console.error(`Error in delete query ${index}:`, err);
                if (completedQueries === 0) {
                    return res.status(500).json({ error: 'Error deleting competition' });
                }
                return;
            }
            
            completedQueries++;
            if (completedQueries === deleteQueries.length) {
                res.json({ success: true, message: 'Competition deleted successfully!' });
            }
        });
    });
});

// ================================================
// COMPETITION CRITERIA ENDPOINTS
// ================================================
app.get('/competition-criteria/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const sql = `
        SELECT * FROM competition_criteria 
        WHERE competition_id = ? 
        ORDER BY order_number, criteria_id
    `;
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching criteria:', err);
            return res.status(500).json({ error: 'Error fetching criteria' });
        }
        res.json(result);
    });
});

app.post('/save-competition-criteria', (req, res) => {
    const { competition_id, criteria } = req.body;
    
    if (!competition_id || !criteria || criteria.length === 0) {
        return res.status(400).json({ error: 'Competition ID and criteria required' });
    }

    // First, delete existing criteria
    db.query('DELETE FROM competition_criteria WHERE competition_id = ?', [competition_id], (err) => {
        if (err) {
            console.error('Error deleting old criteria:', err);
            return res.status(500).json({ error: 'Error updating criteria' });
        }

        // Insert new criteria
        const insertPromises = criteria.map(criterion => {
            return new Promise((resolve, reject) => {
                const sql = `
                    INSERT INTO competition_criteria 
                    (competition_id, criteria_name, description, percentage, max_score, order_number) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                db.query(sql, [
                    competition_id, 
                    criterion.criteria_name, 
                    criterion.description, 
                    criterion.percentage, 
                    criterion.max_score, 
                    criterion.order_number
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        });

        Promise.all(insertPromises)
            .then(() => {
                res.json({ success: true, message: 'Criteria saved successfully!' });
            })
            .catch(err => {
                console.error('Error inserting criteria:', err);
                res.status(500).json({ error: 'Error saving criteria' });
            });
    });
});

// ================================================
// JUDGE ENDPOINTS
// ================================================
app.get('/judges', (req, res) => {
    const sql = `
        SELECT j.*, c.competition_name, et.type_name, et.is_pageant, u.username
        FROM judges j
        LEFT JOIN competitions c ON j.competition_id = c.competition_id
        LEFT JOIN event_types et ON c.event_type_id = et.event_type_id
        LEFT JOIN users u ON j.user_id = u.user_id
        ORDER BY j.judge_name
    `;
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching judges' });
        }
        res.json(result);
    });
});

app.get('/judge-info/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = 'SELECT * FROM judges WHERE user_id = ?';
    db.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching judge info' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Judge not found' });
        }
        res.json(result[0]);
    });
});

app.post('/add-judge', (req, res) => {
    const { 
        judge_name, email, phone, expertise, 
        experience_years = 0, credentials, competition_id 
    } = req.body;

    if (!judge_name || !email || !expertise) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const username = judge_name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
    const password = generatePassword(8);

    // Create user first
    const createUserSql = 'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)';
    db.query(createUserSql, [username, password, 'judge', judge_name], (err, userResult) => {
        if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Error creating judge account' });
        }

        const userId = userResult.insertId;

        // Create judge
        const addJudgeSql = `INSERT INTO judges 
                           (judge_name, email, phone, expertise, experience_years, credentials, competition_id, user_id) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(addJudgeSql, [
            judge_name, email, phone, expertise, experience_years, credentials, competition_id, userId
        ], (err, judgeResult) => {
            if (err) {
                // Remove user if judge creation fails
                db.query('DELETE FROM users WHERE user_id = ?', [userId]);
                console.error('Error adding judge:', err);
                return res.status(500).json({ error: 'Error adding judge' });
            }

            res.json({
                success: true,
                message: 'Judge added successfully!',
                credentials: {
                    username: username,
                    password: password,
                    judge_name: judge_name,
                    judge_id: judgeResult.insertId,
                    user_id: userId
                }
            });
        });
    });
});

app.delete('/delete-judge/:id', (req, res) => {
    const { id } = req.params;

    // Get user ID first
    db.query('SELECT user_id FROM judges WHERE judge_id = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching judge info' });
        }

        const userId = result.length > 0 ? result[0].user_id : null;

        // Delete related scores first
        db.query('DELETE FROM detailed_scores WHERE judge_id = ?', [id], (err) => {
            if (err) console.error('Error deleting detailed scores:', err);
            
            db.query('DELETE FROM overall_scores WHERE judge_id = ?', [id], (err) => {
                if (err) console.error('Error deleting overall scores:', err);
                
                // Delete judge
                db.query('DELETE FROM judges WHERE judge_id = ?', [id], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error deleting judge' });
                    }

                    // Delete user if exists
                    if (userId) {
                        db.query('DELETE FROM users WHERE user_id = ?', [userId], (err) => {
                            if (err) console.error('Error deleting user:', err);
                        });
                    }

                    res.json({ success: true, message: 'Judge deleted successfully!' });
                });
            });
        });
    });
});

// ================================================
// PARTICIPANT ENDPOINTS
// ================================================
app.get('/participants', (req, res) => {
    const sql = `
        SELECT p.*, c.competition_name, et.type_name, et.is_pageant
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        JOIN event_types et ON c.event_type_id = et.event_type_id
        ORDER BY p.participant_name
    `;
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching participants' });
        }
        res.json(result);
    });
});

app.get('/participant/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT p.*, c.competition_name, et.type_name, et.is_pageant
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        JOIN event_types et ON c.event_type_id = et.event_type_id
        WHERE p.participant_id = ?
    `;
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching participant' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        res.json(result[0]);
    });
});

app.post('/add-participant', (req, res) => {
    const { 
        participant_name, email, phone, age, gender, 
        school_organization, performance_title, performance_description, 
        competition_id, status,
        height, measurements, talents, special_awards
    } = req.body;

    if (!participant_name || !email || !age || !gender || !competition_id) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const sql = `INSERT INTO participants 
               (participant_name, email, phone, age, gender, school_organization, 
                performance_title, performance_description, competition_id, status,
                height, measurements, talents, special_awards) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [
        participant_name, email, phone, age, gender, school_organization,
        performance_title, performance_description, competition_id, status || 'pending',
        height, measurements, talents, special_awards
    ], (err, result) => {
        if (err) {
            console.error('Error adding participant:', err);
            return res.status(500).json({ error: 'Error adding participant' });
        }
        res.json({ 
            success: true, 
            message: 'Participant added successfully!',
            participant_id: result.insertId 
        });
    });
});

app.put('/update-participant-status/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'paid', 'waived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const sql = 'UPDATE participants SET status = ? WHERE participant_id = ?';
    db.query(sql, [status, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error updating participant status' });
        }
        res.json({ success: true, message: 'Participant status updated successfully!' });
    });
});

app.delete('/delete-participant/:id', (req, res) => {
    const { id } = req.params;
    
    // Delete scores first
    db.query('DELETE FROM detailed_scores WHERE participant_id = ?', [id], (err) => {
        if (err) console.error('Error deleting detailed scores:', err);
        
        db.query('DELETE FROM overall_scores WHERE participant_id = ?', [id], (err) => {
            if (err) console.error('Error deleting overall scores:', err);
            
            // Then delete participant
            db.query('DELETE FROM participants WHERE participant_id = ?', [id], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Error deleting participant' });
                }
                res.json({ success: true, message: 'Participant deleted successfully!' });
            });
        });
    });
});

// ================================================
// SCORING ENDPOINTS
// ================================================
app.get('/overall-scores/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const sql = `
        SELECT os.*, j.judge_name, p.participant_name, p.performance_title
        FROM overall_scores os
        JOIN judges j ON os.judge_id = j.judge_id
        JOIN participants p ON os.participant_id = p.participant_id
        WHERE os.competition_id = ?
        ORDER BY p.participant_name, os.total_score DESC
    `;
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching overall scores:', err);
            return res.status(500).json({ error: 'Error fetching overall scores' });
        }
        res.json(result);
    });
});

app.get('/live-scores/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const sql = `
        SELECT os.*, j.judge_name, p.participant_name
        FROM overall_scores os
        JOIN judges j ON os.judge_id = j.judge_id
        JOIN participants p ON os.participant_id = p.participant_id
        WHERE os.competition_id = ?
        ORDER BY os.scoring_date DESC
    `;
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching live scores:', err);
            return res.status(500).json({ error: 'Error fetching live scores' });
        }
        res.json(result);
    });
});

app.get('/judge-scores/:judgeId/:competitionId', (req, res) => {
    const { judgeId, competitionId } = req.params;
    const sql = `
        SELECT os.*, p.participant_name
        FROM overall_scores os
        JOIN participants p ON os.participant_id = p.participant_id
        WHERE os.judge_id = ? AND os.competition_id = ?
        ORDER BY p.participant_name
    `;
    db.query(sql, [judgeId, competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching judge scores:', err);
            return res.status(500).json({ error: 'Error fetching judge scores' });
        }
        res.json(result);
    });
});

app.post('/submit-score', (req, res) => {
    const { judge_id, participant_id, competition_id, total_score, detailed_scores, comments, scoring_date } = req.body;

    if (!judge_id || !participant_id || !competition_id || total_score === undefined) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    // Check if score already exists
    const checkSql = 'SELECT * FROM overall_scores WHERE judge_id = ? AND participant_id = ? AND competition_id = ?';
    db.query(checkSql, [judge_id, participant_id, competition_id], (err, existing) => {
        if (err) {
            return res.status(500).json({ error: 'Error checking existing scores' });
        }

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Score already exists for this participant. Use update instead.' });
        }

        const insertSql = `
            INSERT INTO overall_scores 
            (judge_id, participant_id, competition_id, total_score, detailed_scores, comments, scoring_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(insertSql, [judge_id, participant_id, competition_id, total_score, detailed_scores, comments, scoring_date], (err, result) => {
            if (err) {
                console.error('Error submitting score:', err);
                return res.status(500).json({ error: 'Error submitting score' });
            }
            res.json({ success: true, message: 'Score submitted successfully!' });
        });
    });
});

app.post('/update-score', (req, res) => {
    const { judge_id, participant_id, competition_id, total_score, detailed_scores, comments } = req.body;

    if (!judge_id || !participant_id || !competition_id || total_score === undefined) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const updateSql = `
        UPDATE overall_scores 
        SET total_score = ?, detailed_scores = ?, comments = ?, scoring_date = NOW()
        WHERE judge_id = ? AND participant_id = ? AND competition_id = ?
    `;
    
    db.query(updateSql, [total_score, detailed_scores, comments, judge_id, participant_id, competition_id], (err, result) => {
        if (err) {
            console.error('Error updating score:', err);
            return res.status(500).json({ error: 'Error updating score' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Score not found' });
        }

        res.json({ success: true, message: 'Score updated successfully!' });
    });
});

// ================================================
// CRITERIA TEMPLATES ENDPOINTS
// ================================================
app.get('/criteria-templates', (req, res) => {
    const sql = `
        SELECT ct.*, et.type_name
        FROM criteria_templates ct
        JOIN event_types et ON ct.event_type_id = et.event_type_id
        ORDER BY ct.template_name
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching criteria templates:', err);
            return res.status(500).json({ error: 'Error fetching criteria templates' });
        }
        res.json(result);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});