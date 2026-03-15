// Moods functionality
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

let currentMoodId = null;
let selectedSymptoms = {};
let moodHistory = [];
let moodChart = null;

function initializeMoodGrid() {
    const grid = document.getElementById('moodGrid');
    grid.innerHTML = MOOD_OPTIONS.map(mood => `
        <button 
            class="mood-button" 
            style="background-color: ${mood.color}"
            onclick="selectMood('${mood.label}')"
        >
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
        
        // Show appropriate symptoms section
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
            <input 
                type="checkbox" 
                id="${symptom.key}"
                onchange="toggleSymptom('${symptom.key}')"
            />
            <span class="checkbox-label">${symptom.label}</span>
        </label>
    `).join('') + `
        <button class="save-button" onclick="saveSymptoms()" style="margin-top: 8px;">
            Save Symptoms
        </button>
    `;
    
    section.style.display = 'block';
}

function toggleSymptom(key) {
    const checkbox = document.getElementById(key);
    selectedSymptoms[key] = checkbox.checked;
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
        "Extremely Suicidal": 1,
        "Extremely Depressed": 2,
        "Depressed": 3,
        "Sad": 4,
        "Normal": 5,
        "Pleasant": 6,
        "Very Happy": 7,
        "Hypomanic": 8,
        "Manic": 9
    };
    
    // Group by date and calculate average
    const byDate = {};
    moodHistory.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString();
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(moodValues[entry.mood] || 5);
    });
    
    const chartData = Object.entries(byDate)
        .slice(0, 10)
        .reverse()
        .map(([date, values]) => ({
            date,
            value: Math.round(values.reduce((a, b) => a + b) / values.length)
        }));
    
    const ctx = document.getElementById('moodChart').getContext('2d');
    
    if (moodChart) {
        moodChart.destroy();
    }
    
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
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeMoodGrid();
    loadMoodHistory();
});