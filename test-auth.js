// Simple test script for authentication system
const fetch = require('node-fetch'); // You might need to install this: npm install node-fetch

const BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
    console.log('🧪 Testing Authentication System...\n');

    try {
        // Test 1: Register a new user
        console.log('1. Testing user registration...');
        const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                name: 'Test User',
                password: 'TestPassword123!',
                confirmPassword: 'TestPassword123!'
            })
        });

        if (registerResponse.ok) {
            const registerData = await registerResponse.json();
            console.log('✅ Registration successful:', registerData.user.name);
            
            // Test 2: Login with the new user
            console.log('\n2. Testing user login...');
            const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'TestPassword123!'
                })
            });

            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                console.log('✅ Login successful:', loginData.user.name);
                const token = loginData.token;

                // Test 3: Access protected route
                console.log('\n3. Testing protected route access...');
                const profileResponse = await fetch(`${BASE_URL}/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    console.log('✅ Protected route access successful:', profileData.user.name);
                } else {
                    console.log('❌ Protected route access failed:', await profileResponse.text());
                }

                // Test 4: Access without token (should fail)
                console.log('\n4. Testing access without token...');
                const noTokenResponse = await fetch(`${BASE_URL}/auth/profile`);
                if (noTokenResponse.status === 401) {
                    console.log('✅ Correctly blocked access without token');
                } else {
                    console.log('❌ Should have blocked access without token');
                }

            } else {
                console.log('❌ Login failed:', await loginResponse.text());
            }
        } else {
            const error = await registerResponse.text();
            if (error.includes('already exists')) {
                console.log('ℹ️  User already exists, testing login...');
                
                // Try login with existing user
                const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'TestPassword123!'
                    })
                });

                if (loginResponse.ok) {
                    console.log('✅ Login with existing user successful');
                } else {
                    console.log('❌ Login failed:', await loginResponse.text());
                }
            } else {
                console.log('❌ Registration failed:', error);
            }
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('\n💡 Make sure the server is running on port 3000');
        console.log('   Run: npm start');
    }

    console.log('\n🏁 Authentication test completed');
}

// Run the test
testAuth();