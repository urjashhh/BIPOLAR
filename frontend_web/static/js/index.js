// Rotating quotes functionality
let currentQuoteIndex = 0;

function updateQuote() {
    const quoteText = document.getElementById('quoteText');
    if (quoteText) {
        quoteText.textContent = `"${MOTIVATIONAL_QUOTES[currentQuoteIndex]}"`;
        currentQuoteIndex = (currentQuoteIndex + 1) % MOTIVATIONAL_QUOTES.length;
    }
}

// Initialize quote rotation
document.addEventListener('DOMContentLoaded', () => {
    updateQuote(); // Show first quote immediately
    setInterval(updateQuote, 15000); // Rotate every 15 seconds
});