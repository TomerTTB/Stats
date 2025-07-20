// Simple test for registration endpoint
const fetch = require('node-fetch');

async function testRegistration() {
    console.log('🧪 Testing Registration Endpoint...\n');

    const testUser = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!'
    };

    try {
        console.log('Sending registration request with:', testUser);
        
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });

        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (response.ok) {
            console.log('✅ Registration successful!');
            console.log('Token received:', !!data.token);
            console.log('User info:', data.user);
        } else {
            console.log('❌ Registration failed:', data.error);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('\n💡 Make sure the server is running on port 3000');
    }
}

// Run the test
testRegistration();