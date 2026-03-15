// Gratitude functionality
let entries = [];

async function loadEntries() {
    const container = document.getElementById('entriesContainer');
    showLoading(container);
    
    try {
        entries = await apiCall(`/gratitude?user=${USER_ID}`);
        
        if (entries.length === 0) {
            showEmpty(container, '📔', 'No gratitude entries yet', 'Write your first entry above');
            return;
        }
        
        container.innerHTML = entries.map(entry => `
            <div class="entry-card">
                <div class="entry-title">${escapeHtml(entry.title)}</div>
                <div class="entry-description" style="font-size: 16px; color: #475569; line-height: 24px; margin: 8px 0;">
                    ${escapeHtml(entry.description)}
                </div>
                <div class="entry-date">${formatDate(entry.date)}</div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="empty-container"><div class="empty-title">Error loading entries</div></div>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEntries();
    
    // Enable button only when both fields have content
    const titleInput = document.getElementById('titleInput');
    const descInput = document.getElementById('descriptionInput');
    const saveButton = document.getElementById('saveButton');
    
    function updateButtonState() {
        saveButton.disabled = !titleInput.value.trim() || !descInput.value.trim();
    }
    
    titleInput.addEventListener('input', updateButtonState);
    descInput.addEventListener('input', updateButtonState);
    updateButtonState();
});