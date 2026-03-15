// Shared utilities and constants
const API_URL = '/api';
const USER_ID = 'default_user';

// Motivational quotes
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

// API helper functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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