async function login() {
    const url = document.getElementById('url').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const responseMessage = document.getElementById('responseMessage');
    responseMessage.textContent = 'Logging in...';

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, username, password })
        });

        const data = await response.json();
        if (response.ok) {
            responseMessage.textContent = data.message;
        } else {
            responseMessage.textContent = 'Login failed: ' + data.message;
        }
    } catch (error) {
        console.error('Error:', error);
        responseMessage.textContent = 'An error occurred.';
    }
}
