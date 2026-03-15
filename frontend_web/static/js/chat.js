// Chat functionality
let messages = [];
let loading = false;

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
    // Convert markdown-style formatting to HTML
    return escapeHtml(text)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const message = input.value.trim();
    
    if (!message || loading) return;
    
    loading = true;
    input.value = '';
    sendButton.disabled = true;
    
    // Add loading indicator
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
        loading = false;
        sendButton.disabled = false;
    }
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

// Enter to send
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('messageInput');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    loadChatHistory();
});