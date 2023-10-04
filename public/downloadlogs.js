async function getLog() {
    const date = document.getElementById('date').value;
    const logContent = document.getElementById('logContent');

    logContent.textContent = 'Fetching log...';

    try {
        const response = await fetch('/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date })
        });

        if (response.ok) {
            const blob = await response.blob();
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(blob);
            a.download = `log-${date}.log`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            logContent.textContent = 'Log file downloaded.';
        } else {
            const errorData = await response.json();
            logContent.textContent = 'Error: ' + errorData.error;
        }
    } catch (error) {
        console.error('Error:', error);
        logContent.textContent = 'An error occurred.';
    }
}
