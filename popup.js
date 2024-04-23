document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {request: 'getWebMs'}, (webMs) => {
            populateWebMList([...new Set(webMs)]); // Remove duplicates before populating the list
        });
    });

    document.getElementById('download').addEventListener('click', function() {
        const selectedUrls = Array.from(document.querySelectorAll('#webm-list input[type="checkbox"]:checked'))
                                 .map(input => input.value);
        downloadWebMs(selectedUrls);
    });

    document.getElementById('download-all').addEventListener('click', function() {
        const allUrls = Array.from(document.querySelectorAll('#webm-list input[type="checkbox"]'))
                             .map(input => input.value);
        downloadWebMs(allUrls);
    });
});

async function populateWebMList(webMUrls) {
    const listElement = document.getElementById('webm-list');
    listElement.innerHTML = ''; // Clear existing entries to avoid duplication
    let seenUrls = new Set();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const videoElement = entry.target;
                videoElement.src = videoElement.getAttribute('data-src'); // Load video only when it enters the viewport
                videoElement.preload = 'auto'; // Start loading video when it becomes visible

                videoElement.addEventListener('loadedmetadata', () => {
                    videoElement.currentTime = 0.1; // Seek to first frame after metadata is loaded
                });

                videoElement.addEventListener('seeked', () => {
                    // This function will run a lot, consider throttling the canvas creation
                    const canvas = document.createElement('canvas');
                    canvas.width = videoElement.videoWidth;
                    canvas.height = videoElement.videoHeight;
                    const context = canvas.getContext('2d');
                    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    videoElement.poster = canvas.toDataURL(); // Set the first frame as poster
                });

                observer.unobserve(videoElement); // Stop observing once loaded
            }
        });
    }, {
        rootMargin: '50px' // Load elements just before they enter the viewport
    });

    for (const url of webMUrls) {
        if (!seenUrls.has(url)) {
            seenUrls.add(url); // Track seen URLs to avoid duplicates
            const listItem = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = url;

            const videoElement = document.createElement('video');
            videoElement.setAttribute('data-src', url); // Set data-src instead of src
            videoElement.width = 150; // Set preview size
            videoElement.preload = 'none'; // Don't load video until observed

            const filename = url.split('/').pop(); // Extract filename from URL
            const label = document.createElement('label');
            label.textContent = filename;

            listItem.appendChild(videoElement);
            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            listElement.appendChild(listItem);

            observer.observe(videoElement); // Begin observing the video element
        }
    }
}


function downloadWebMs(urls) {
    urls.forEach(url => {
        const filename = url.split('/').pop();  // Extracts filename from URL
        chrome.downloads.download({
            url: url,
            filename: '4ch_webms/' + filename,  // Suggest a subdirectory
            conflictAction: 'uniquify',
            saveAs: false  // Change to false for automatic downloads
        }, function(downloadId) {
            if (chrome.runtime.lastError) {
                console.error("Download failed: " + chrome.runtime.lastError.message);
            } else {
                console.log("Download successfully initiated with ID: ", downloadId);
            }
        });
    });
}
