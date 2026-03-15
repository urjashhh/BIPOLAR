// Configuration
const API_URL = '/api';
const USER_ID = 'default_user';

// Quotes
const MOTIVATIONAL_QUOTES = [
    "DISCIPLINE Trumps motivation",
    "Success is not final, failure is not fatal: it is the courage to continue that counts",
    "The only way to do great work is to love what you do",
    "Your limitation—it's only your imagination",
    "Push yourself, because no one else is going to do it for you",
    "Great things never come from comfort zones",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it",
    "The harder you work for something, the greater you'll feel when you achieve it",
    "Don't stop when you're tired. Stop when you're done",
    "Wake up with determination. Go to bed with satisfaction",
    "Do something today that your future self will thank you for",
    "Little things make big days",
    "It's going to be hard, but hard does not mean impossible",
    "Don't wait for opportunity. Create it",
    "Sometimes we're tested not to show our weaknesses, but to discover our strengths",
    "The key to success is to focus on goals, not obstacles",
    "Dream bigger. Do bigger",
    "Don't tell people your plans. Show them your results",
    "Work hard in silence, let your success be the noise",
    "The struggle you're in today is developing the strength you need tomorrow",
    "Perseverance is not a long race; it is many short races one after the other",
    "Fall seven times, stand up eight",
    "It does not matter how slowly you go as long as you do not stop",
    "Mental toughness is not an option—it's a necessity for success",
];

const MOOD_OPTIONS = [
    { label: "Manic", color: "#dc2626" },
    { label: "Hypomanic", color: "#ea580c" },
    { label: "Very Happy", color: "#f59e0b" },
    { label: "Pleasant", color: "#fbbf24" },
    { label: "Normal", color: "#10b981" },
    { label: "Sad", color: "#3b82f6" },
    { label: "Depressed", color: "#6366f1" },
    { label: "Extremely Depressed", color: "#7c3aed" },
    { label: "Extremely Suicidal", color: "#991b1b" },
];

const MANIA_SYMPTOMS = [
    { key: "racing_thoughts", label: "Racing Thoughts" },
    { key: "no_sleep", label: "No Need of Sleep" },
    { key: "over_interest", label: "Overly Interested in Things" },
    { key: "lack_control", label: "Lack of Physical Control" },
    { key: "anxiety", label: "Anxiety" },
    { key: "ordering", label: "Ordering" },
    { key: "over_planning", label: "Over Planning" },
];

const DEPRESSION_SYMPTOMS = [
    { key: "self_harm", label: "Self Harm" },
    { key: "angry", label: "Angry" },
    { key: "depressed_anxiety", label: "Anxious" },
];

// Global State
let currentQuoteIndex = 0;
let currentMoodId = null;
let selectedSymptoms = {};
let moodHistory = [];
let messages = [];
let tasks = [];
let scores = [];
let checkedTasks = new Set();
let moodChart = null;
let scoreChart = null;

// Utilities
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(container) {
    container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
}

function showEmpty(container, icon, title, subtitle) {
    container.innerHTML = `
        <div class="empty-container">
            <div class="empty-icon">${icon}</div>
            <div class="empty-title">${title}</div>
            <div class="empty-subtitle">${subtitle}</div>
        </div>
    `;
}

// Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    
    if (pageId === 'chatPage') loadChatHistory();
    else if (pageId === 'moodsPage') { initializeMoodGrid(); loadMoodHistory(); }
    else if (pageId === 'gratitudePage') loadEntries();
    else if (pageId === 'routinePage') { loadTasks(); loadScores(); }
}

// Quote Rotation
function updateQuote() {
    const quoteText = document.getElementById('quoteText');
    if (quoteText) {
        quoteText.textContent = `"${MOTIVATIONAL_QUOTES[currentQuoteIndex]}"`;
        currentQuoteIndex = (currentQuoteIndex + 1) % MOTIVATIONAL_QUOTES.length;
    }
}

// Chat Functions
async function loadChatHistory() {
    const container = document.getElementById('messagesContainer');
    showLoading(container);
    
    try {
        messages = await apiCall(`/chat?user=${USER_ID}`);
        renderMessages();
        scrollToBottom();
    } catch (error) {
        container.innerHTML = '<div class="empty-container"><div class="empty-title">Error loading messages</div></div>';
    }
}

function renderMessages() {
    const container = document.getElementById('messagesContainer');
    
    if (messages.length === 0) {
        showEmpty(container, '💬', 'Start a conversation', 'Share how you\'re feeling, and I\'ll listen');
        return;
    }
    
    container.innerHTML = messages.map(msg => `
        <div class="user-message">
            <div class="message-text">${escapeHtml(msg.user_message)}</div>
            <div class="timestamp">${formatTime(msg.timestamp)}</div>
        </div>
        <div class="ai-message">
            <div class="message-text">${formatAIResponse(msg.ai_response)}</div>
            <div class="timestamp">${formatTime(msg.timestamp)}</div>
        </div>
    `).join('');
}

function formatAIResponse(text) {
    return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const message = input.value.trim();
    
    if (!message) return;
    
    sendButton.disabled = true;
    input.value = '';
    
    const container = document.getElementById('messagesContainer');
    container.innerHTML += '<div class="ai-message"><div class="loading-container"><div class="spinner"></div></div></div>';
    scrollToBottom();
    
    try {
        const response = await apiCall('/chat', {
            method: 'POST',
            body: JSON.stringify({ message, user: USER_ID })
        });
        
        messages.push(response);
        renderMessages();
        scrollToBottom();
    } catch (error) {
        alert('Failed to send message. Please try again.');
    } finally {
        sendButton.disabled = false;
    }
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

// Moods Functions
function initializeMoodGrid() {
    const grid = document.getElementById('moodGrid');
    grid.innerHTML = MOOD_OPTIONS.map(mood => `
        <button class="mood-button" style="background-color: ${mood.color}" onclick="selectMood('${mood.label}')">
            ${mood.label}
        </button>
    `).join('');
}

async function selectMood(mood) {
    try {
        const response = await apiCall('/moods', {
            method: 'POST',
            body: JSON.stringify({ mood, user: USER_ID })
        });
        
        currentMoodId = response.id;
        selectedSymptoms = {};
        
        if (['Very Happy', 'Hypomanic', 'Manic'].includes(mood)) {
            showSymptoms('Mania Symptoms', MANIA_SYMPTOMS);
        } else if (['Depressed', 'Extremely Depressed'].includes(mood)) {
            showSymptoms('Depression Symptoms', DEPRESSION_SYMPTOMS);
        } else {
            document.getElementById('symptomsSection').style.display = 'none';
        }
        
        await loadMoodHistory();
    } catch (error) {
        alert('Failed to save mood. Please try again.');
    }
}

function showSymptoms(title, symptoms) {
    const section = document.getElementById('symptomsSection');
    const titleEl = document.getElementById('symptomsTitle');
    const container = document.getElementById('symptomsContainer');
    
    titleEl.textContent = title;
    container.innerHTML = symptoms.map(symptom => `
        <label class="checkbox-row">
            <input type="checkbox" id="${symptom.key}" onchange="toggleSymptom('${symptom.key}')" />
            <span class="checkbox-label">${symptom.label}</span>
        </label>
    `).join('') + '<button class="save-button" onclick="saveSymptoms()" style="margin-top: 8px;">Save Symptoms</button>';
    
    section.style.display = 'block';
}

function toggleSymptom(key) {
    selectedSymptoms[key] = document.getElementById(key).checked;
}

async function saveSymptoms() {
    if (!currentMoodId) return;
    
    try {
        await apiCall(`/moods/${currentMoodId}`, {
            method: 'PUT',
            body: JSON.stringify(selectedSymptoms)
        });
        
        document.getElementById('symptomsSection').style.display = 'none';
        currentMoodId = null;
        selectedSymptoms = {};
        
        await loadMoodHistory();
    } catch (error) {
        alert('Failed to save symptoms. Please try again.');
    }
}

async function loadMoodHistory() {
    const container = document.getElementById('historyContainer');
    
    try {
        moodHistory = await apiCall(`/moods?user=${USER_ID}`);
        
        if (moodHistory.length === 0) {
            showEmpty(container, '😊', 'No mood entries yet', 'Track your first mood above');
            return;
        }
        
        renderMoodHistory();
        renderMoodChart();
    } catch (error) {
        container.innerHTML = '<div class="empty-container"><div class="empty-title">Error loading history</div></div>';
    }
}

function renderMoodHistory() {
    const container = document.getElementById('historyContainer');
    
    container.innerHTML = moodHistory.map(entry => {
        const symptoms = [];
        if (entry.racing_thoughts) symptoms.push('Racing Thoughts');
        if (entry.no_sleep) symptoms.push('No Need of Sleep');
        if (entry.over_interest) symptoms.push('Overly Interested');
        if (entry.lack_control) symptoms.push('Lack of Control');
        if (entry.anxiety) symptoms.push('Anxiety');
        if (entry.ordering) symptoms.push('Ordering');
        if (entry.over_planning) symptoms.push('Over Planning');
        if (entry.self_harm) symptoms.push('Self Harm');
        if (entry.angry) symptoms.push('Angry');
        if (entry.depressed_anxiety) symptoms.push('Anxious');
        
        return `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-mood">${entry.mood}</span>
                    <span class="history-date">${formatDate(entry.date)}</span>
                </div>
                ${symptoms.length > 0 ? `
                    <div class="symptoms-tags-container">
                        ${symptoms.map(s => `<span class="symptom-tag">${s}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderMoodChart() {
    if (moodHistory.length === 0) {
        document.getElementById('chartSection').style.display = 'none';
        return;
    }
    
    document.getElementById('chartSection').style.display = 'block';
    
    const moodValues = {
        "Extremely Suicidal": 1, "Extremely Depressed": 2, "Depressed": 3, "Sad": 4,
        "Normal": 5, "Pleasant": 6, "Very Happy": 7, "Hypomanic": 8, "Manic": 9
    };
    
    const byDate = {};
    moodHistory.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString();
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(moodValues[entry.mood] || 5);
    });
    
    const chartData = Object.entries(byDate).slice(0, 10).reverse().map(([date, values]) => ({
        date, value: Math.round(values.reduce((a, b) => a + b) / values.length)
    }));
    
    const ctx = document.getElementById('moodChart').getContext('2d');
    
    if (moodChart) moodChart.destroy();
    
    moodChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => new Date(d.date).getDate()),
            datasets: [{
                label: 'Mood Level',
                data: chartData.map(d => d.value),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: { y: { beginAtZero: true, max: 10, ticks: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

// Gratitude Functions
async function loadEntries() {
    const container = document.getElementById('entriesContainer');
    showLoading(container);
    
    try {
        const entries = await apiCall(`/gratitude?user=${USER_ID}`);
        
        if (entries.length === 0) {
            showEmpty(container, '📔', 'No gratitude entries yet', 'Write your first entry above');
            return;
        }
        
        container.innerHTML = entries.map(entry => `
            <div class="entry-card">
                <div class="entry-title">${escapeHtml(entry.title)}</div>
                <div style="font-size: 16px; color: #475569; line-height: 24px; margin: 8px 0;">
                    ${escapeHtml(entry.description)}
                </div>
                <div class="entry-date">${formatDate(entry.date)}</div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="empty-container"><div class="empty-title">Error loading entries</div></div>';
    }
}

async function saveEntry() {
    const titleInput = document.getElementById('titleInput');
    const descInput = document.getElementById('descriptionInput');
    const saveButton = document.getElementById('saveButton');
    
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    
    if (!title || !description) return;
    
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    
    try {
        await apiCall('/gratitude', {
            method: 'POST',
            body: JSON.stringify({ title, description, user: USER_ID })
        });
        
        titleInput.value = '';
        descInput.value = '';
        await loadEntries();
    } catch (error) {
        alert('Failed to save entry. Please try again.');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Entry';
    }
}

// Routine Functions
async function loadTasks() {
    try {
        tasks = await apiCall(`/routine/tasks?user=${USER_ID}`);
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

async function loadScores() {
    const container = document.getElementById('scoresContainer');
    
    try {
        scores = await apiCall(`/routine/scores?user=${USER_ID}`);
        
        if (scores.length === 0) {
            showEmpty(container, '✓', 'No scores saved yet', 'Complete tasks and save your score');
            document.getElementById('scoreChartSection').style.display = 'none';
            return;
        }
        
        container.innerHTML = scores.map(score => `
            <div class="score-card" style="border-left: 4px solid #10b981;">
                <div style="font-size: 18px; font-weight: 600; color: #10b981;">${score.total_points} points</div>
                <div class="score-date">${formatDate(score.score_date)}</div>
            </div>
        `).join('');
        
        renderScoreChart();
    } catch (error) {
        container.innerHTML = '<div class="empty-container"><div class="empty-title">Error loading scores</div></div>';
    }
}

function renderTasks() {
    const container = document.getElementById('tasksContainer');
    const scoreSection = document.getElementById('scoreSection');
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-container"><div class="empty-subtitle">No tasks yet. Add your first task above!</div></div>';
        scoreSection.style.display = 'none';
        return;
    }
    
    container.innerHTML = '<div style="background-color: white; border-radius: 12px; overflow: hidden;">' + 
        tasks.map(task => `
            <div class="task-row" style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid #f1f5f9; gap: 12px;">
                <input type="checkbox" id="task-${task.id}" onchange="toggleTask('${task.id}')" style="width: 20px; height: 20px; cursor: pointer;" />
                <label for="task-${task.id}" style="flex: 1; font-size: 16px; cursor: pointer;">${escapeHtml(task.taskName)}</label>
                <span style="font-size: 14px; color: #10b981; font-weight: 600;">${task.points} points</span>
            </div>
        `).join('') + '</div>';
    
    scoreSection.style.display = 'block';
    updateCurrentScore();
}

function toggleTask(taskId) {
    if (checkedTasks.has(taskId)) {
        checkedTasks.delete(taskId);
    } else {
        checkedTasks.add(taskId);
    }
    updateCurrentScore();
}

function updateCurrentScore() {
    document.getElementById('currentScore').textContent = checkedTasks.size * 10;
}

async function addTask() {
    const input = document.getElementById('taskInput');
    const addButton = document.getElementById('addButton');
    const taskName = input.value.trim();
    
    if (!taskName) return;
    
    addButton.disabled = true;
    addButton.textContent = 'Adding...';
    
    try {
        await apiCall('/routine/tasks', {
            method: 'POST',
            body: JSON.stringify({ taskName, user: USER_ID })
        });
        
        input.value = '';
        await loadTasks();
    } catch (error) {
        alert('Failed to add task. Please try again.');
    } finally {
        addButton.disabled = false;
        addButton.textContent = 'Add Task';
    }
}

async function saveDailyScore() {
    const totalPoints = checkedTasks.size * 10;
    
    try {
        await apiCall('/routine/scores', {
            method: 'POST',
            body: JSON.stringify({ total_points: totalPoints, user: USER_ID })
        });
        
        checkedTasks.clear();
        tasks.forEach(task => {
            const checkbox = document.getElementById(`task-${task.id}`);
            if (checkbox) checkbox.checked = false;
        });
        updateCurrentScore();
        await loadScores();
    } catch (error) {
        alert('Failed to save score. Please try again.');
    }
}

function renderScoreChart() {
    if (scores.length === 0) return;
    
    document.getElementById('scoreChartSection').style.display = 'block';
    
    const chartData = scores.slice(0, 10).reverse().map(score => ({
        date: new Date(score.score_date).getDate(),
        points: score.total_points
    }));
    
    const ctx = document.getElementById('scoreChart').getContext('2d');
    
    if (scoreChart) scoreChart.destroy();
    
    scoreChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.date),
            datasets: [{
                label: 'Score',
                data: chartData.map(d => d.points),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateQuote();
    setInterval(updateQuote, 15000);
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});