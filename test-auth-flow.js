// Test the complete authentication flow
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testAuthFlow() {
    console.log('🧪 Testing Complete Authentication Flow...\n');

    try {
        // Step 1: Clear any existing user and register a new one
        console.log('1. Registering a new user...');
        const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testuser@example.com',
                name: 'Test User',
                password: 'TestPass123!',
                confirmPassword: 'TestPass123!'
            })
        });

        if (registerResponse.ok) {
            const registerData = await registerResponse.json();
            console.log('✅ Registration successful');
            console.log('   User:', registerData.user.name);
            console.log('   Token received:', !!registerData.token);
            
            const token = registerData.token;

            // Step 2: Test token verification
            console.log('\n2. Testing token verification...');
            const verifyResponse = await fetch(`${BASE_URL}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                console.log('✅ Token verification successful');
                console.log('   Valid:', verifyData.valid);
            } else {
                console.log('❌ Token verification failed:', verifyResponse.status);
            }

            // Step 3: Test protected endpoint
            console.log('\n3. Testing protected endpoint (foods)...');
            const foodsResponse = await fetch(`${BASE_URL}/foods`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (foodsResponse.ok) {
                console.log('✅ Protected endpoint access successful');
            } else {
                console.log('❌ Protected endpoint access failed:', foodsResponse.status);
            }

            // Step 4: Test /api/auth/me endpoint
            console.log('\n4. Testing /api/auth/me endpoint...');
            const meResponse = await fetch(`${BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (meResponse.ok) {
                const meData = await meResponse.json();
                console.log('✅ /api/auth/me successful');
                console.log('   User:', meData.user.name);
            } else {
                console.log('❌ /api/auth/me failed:', meResponse.status);
            }

        } else {
            const error = await registerResponse.text();
            console.log('❌ Registration failed:', error);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('\n💡 Make sure the server is running on port 3000');
    }

    console.log('\n🏁 Authentication flow test completed');
}

// Run the test
testAuthFlow();