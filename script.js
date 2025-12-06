// Page switching functionality
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.link');
    const overlay = document.getElementById('page-overlay');
    const closeBtn = document.getElementById('close-btn');
    const pageContent = document.getElementById('page-content');

    // Page files mapping
    const pageFiles = {
        imprint: 'pages/imprint.html',
        privacy: 'pages/privacy.html'
    };

    // Cache for loaded content
    const contentCache = {};

    // Track page open time for fade-in timing
    let pageOpenTime = 0;
    const FADE_IN_DELAY = 300; // Wait after overlay fade for content fade-in

    // Open page function
    async function openPage(pageId) {
        const filePath = pageFiles[pageId];
        if (!filePath) return;

        // Reset content state and track open time
        pageOpenTime = Date.now();
        pageContent.classList.remove('fade-in');
        pageContent.innerHTML = '<h1>Loading...</h1>';

        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        // Load content
        try {
            let content;
            
            // Check cache first
            if (contentCache[pageId]) {
                content = contentCache[pageId];
                displayContent(content);
            } else {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error('Failed to load page');
                const html = await response.text();
                contentCache[pageId] = html;
                content = html;
                displayContent(content);
            }
        } catch (error) {
            console.error('Error loading page:', error);
            pageContent.innerHTML = '<h1>Error</h1><p>Failed to load page content.</p>';
            displayContent(pageContent.innerHTML); // Still trigger fade-in for error
        }
    }

    function displayContent(html) {
        pageContent.innerHTML = html;
        
        // Calculate how much time has passed since page opened
        const elapsed = Date.now() - pageOpenTime;
        const remainingDelay = Math.max(0, FADE_IN_DELAY - elapsed);
        
        // Trigger fade-in after remaining delay
        setTimeout(() => {
            pageContent.classList.add('fade-in');
        }, remainingDelay);
    }

    // Close page function
    function closePage() {
        // Remove fade-in class first for content
        pageContent.classList.remove('fade-in');
        
        overlay.classList.remove('visible');
        overlay.classList.add('hidden');
        
        setTimeout(() => {
            if (!overlay.classList.contains('visible')) {
                overlay.style.display = 'none';
                // Clear content when closing
                pageContent.innerHTML = '';
            }
        }, 300); // Wait for fade out animation
    }

    // Event listeners for links
    links.forEach(link => {
        link.addEventListener('click', () => {
            const pageId = link.getAttribute('data-page');
            openPage(pageId);
        });
    });

    // Event listener for close button
    closeBtn.addEventListener('click', closePage);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePage();
        }
    });
});

