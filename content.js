// This function runs in the context of the 4chan page and gathers WebM links
function scrapeWebMs() {
    const webMs = Array.from(document.querySelectorAll('a')).filter(a => a.href.endsWith('.webm'));
    return webMs.map(a => a.href);
}

// Listen for a message from the popup to send the WebM links
chrome.runtime.onMessage.addListener((msg, sender, response) => {
    if (msg.request === 'getWebMs') {
        response(scrapeWebMs());
    }
});
