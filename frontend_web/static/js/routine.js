// Routine functionality
let tasks = [];
let scores = [];
let checkedTasks = new Set();
let scoreChart = null;

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
            document.getElementById('chartSection').style.display = 'none';
            return;
        }
        
        container.innerHTML = scores.map(score => `
            <div class="score-card" style="border-left: 4px solid #10b981;">
                <div style="font-size: 18px; font-weight: 600; color: #10b981;">
                    ${score.total_points} points
                </div>
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
                <input 
                    type="checkbox" 
                    id="task-${task.id}"
                    onchange="toggleTask('${task.id}')"
                    style="width: 20px; height: 20px; cursor: pointer;"
                />
                <label for="task-${task.id}" style="flex: 1; font-size: 16px; cursor: pointer;">${escapeHtml(task.taskName)}</label>
                <span style="font-size: 14px; color: #10b981; font-weight: 600;">${task.points} points</span>
            </div>
        `).join('') + '</div>';
    
    scoreSection.style.display = 'block';
    updateCurrentScore();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    const score = checkedTasks.size * 10;
    document.getElementById('currentScore').textContent = score;
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
        // Uncheck all checkboxes
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
    
    document.getElementById('chartSection').style.display = 'block';
    
    const chartData = scores
        .slice(0, 10)
        .reverse()
        .map(score => ({
            date: new Date(score.score_date).getDate(),
            points: score.total_points
        }));
    
    const ctx = document.getElementById('scoreChart').getContext('2d');
    
    if (scoreChart) {
        scoreChart.destroy();
    }
    
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
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadScores();
    
    // Enable add button only when input has content
    const taskInput = document.getElementById('taskInput');
    const addButton = document.getElementById('addButton');
    
    taskInput.addEventListener('input', () => {
        addButton.disabled = !taskInput.value.trim();
    });
    addButton.disabled = true;
});