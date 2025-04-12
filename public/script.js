document.addEventListener('DOMContentLoaded', function() {
    const shortenBtn = document.getElementById('shortenBtn');
    const longUrlInput = document.getElementById('longUrl');
    const resultContainer = document.getElementById('result');
    const shortUrlInput = document.getElementById('shortUrl');
    const copyBtn = document.getElementById('copyBtn');

    shortenBtn.addEventListener('click', shortenUrl);
    copyBtn.addEventListener('click', copyToClipboard);
    
    longUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            shortenUrl();
        }
    });

    async function shortenUrl() {
        const longUrl = longUrlInput.value.trim();
        
        if (!longUrl) {
            alert('Please enter a URL');
            return;
        }

        if (!isValidUrl(longUrl)) {
            alert('Please enter a valid URL');
            return;
        }

        shortenBtn.disabled = true;
        shortenBtn.textContent = 'Shortening...';

        try {
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: longUrl })
            });

            const data = await response.json();

            if (response.ok) {
                shortUrlInput.value = `${window.location.origin}/${data.shortCode}`;
                resultContainer.style.display = 'block';
            } else {
                alert(data.error || 'Failed to shorten URL');
            }
        } catch (error) {
            alert('Network error. Please try again.');
        } finally {
            shortenBtn.disabled = false;
            shortenBtn.textContent = 'Shorten URL';
        }
    }

    function copyToClipboard() {
        shortUrlInput.select();
        document.execCommand('copy');
        
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#28a745';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
});