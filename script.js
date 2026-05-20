function wireObfuscatedLinks(root = document) {
    root.querySelectorAll('a.obf-mailto').forEach((link) => {
        const address = link.textContent.trim().replace(/\s+/g, '');
        if (address.includes('@')) {
            link.href = 'mailto:' + address;
        }
    });

    root.querySelectorAll('a.obf-https').forEach((link) => {
        const target = link.textContent.trim().replace(/\s+/g, '');
        link.href = target.startsWith('http') ? target : 'https://' + target;
    });
}

// Page switching + waitlist (Web3Forms)
document.addEventListener('DOMContentLoaded', () => {
    wireObfuscatedLinks();

    const waitlistForm = document.getElementById('waitlist-form');
    const waitlistMessage = document.getElementById('waitlist-message');
    const submitButton = waitlistForm?.querySelector('button[type="submit"]');

    if (waitlistForm) {
        waitlistForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!waitlistMessage || !submitButton) return;

            waitlistMessage.hidden = false;
            waitlistMessage.classList.remove('is-error');
            waitlistMessage.textContent = 'Submitting…';
            submitButton.disabled = true;

            try {
                const response = await fetch(waitlistForm.action, {
                    method: 'POST',
                    body: new FormData(waitlistForm),
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    waitlistMessage.textContent = "You're on the list — we'll be in touch.";
                    waitlistForm.reset();
                } else {
                    throw new Error(data.message || 'Submission failed');
                }
            } catch {
                waitlistMessage.classList.add('is-error');
                waitlistMessage.textContent =
                    'Something went wrong. Please try again in a moment.';
            } finally {
                submitButton.disabled = false;
            }
        });
    }

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

        overlay.removeAttribute('hidden');
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
        wireObfuscatedLinks(pageContent);

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
                overlay.setAttribute('hidden', '');
                pageContent.innerHTML = '';
            }
        }, 300);
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

