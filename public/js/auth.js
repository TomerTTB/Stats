// Authentication utilities for frontend
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get auth token
    getToken() {
        return this.token;
    }

    // Set authentication data
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    // Clear authentication data
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    // Make authenticated API request
    async apiRequest(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle token expiration - but don't auto-redirect
        if (response.status === 401 || response.status === 403) {
            console.log('Authentication failed for:', url);
            // Only clear auth, don't auto-redirect to prevent loops
            this.clearAuth();
        }

        return response;
    }

    // Login
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuth(data.token, data.user);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error during login' };
        }
    }

    // Register
    async register(email, name, password, confirmPassword) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, name, password, confirmPassword })
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuth(data.token, data.user);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error during registration' };
        }
    }

    // Logout
    async logout() {
        try {
            // Set redirecting flag to prevent auth checks during logout
            window.isRedirecting = true;
            
            if (this.token) {
                await this.apiRequest('/api/auth/logout', {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
            // Small delay to ensure auth is cleared before redirect
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 100);
        }
    }

    // Verify token
    async verifyToken() {
        if (!this.token) return false;

        try {
            // Use direct fetch instead of apiRequest to avoid auth clearing
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.valid;
            }

            // Token is invalid
            if (response.status === 401 || response.status === 403) {
                return false;
            }

            return false;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== '/login.html') {
                window.location.href = '/login.html';
            }
            return false;
        }
        return true;
    }
}

// Create global auth manager instance
const auth = new AuthManager();

// Prevent multiple redirects
let isRedirecting = false;

// Auto-redirect to login if not authenticated (for protected pages)
document.addEventListener('DOMContentLoaded', async () => {
    // Check if current page requires authentication
    const protectedPages = ['/diary.html', '/foods.html', '/reports.html', '/settings.html'];
    const currentPath = window.location.pathname;

    // Skip auth check if we're already on login page or if redirect is in progress
    if (currentPath === '/login.html' || isRedirecting) {
        console.log('Skipping auth check - on login page or redirect in progress');
        return;
    }

    if (protectedPages.includes(currentPath)) {
        // Prevent multiple redirects
        if (isRedirecting) {
            console.log('Redirect already in progress, skipping auth check');
            return;
        }

        // First check if we have a token
        if (!auth.isAuthenticated()) {
            console.log('No authentication found, redirecting to login');
            isRedirecting = true;
            window.location.href = '/login.html';
            return;
        }

        // Verify the token is still valid
        try {
            const isValid = await auth.verifyToken();
            if (!isValid) {
                console.log('Token invalid, redirecting to login');
                auth.clearAuth();
                isRedirecting = true;
                window.location.href = '/login.html';
                return;
            }
            console.log('Authentication verified, staying on protected page');
        } catch (error) {
            console.log('Token verification failed, redirecting to login');
            auth.clearAuth();
            isRedirecting = true;
            window.location.href = '/login.html';
            return;
        }
    }

    // Update UI based on auth status
    updateAuthUI();
});

// Update UI elements based on authentication status
function updateAuthUI() {
    const user = auth.getCurrentUser();
    const userNameElements = document.querySelectorAll('.user-name');
    const loginElements = document.querySelectorAll('.login-required');
    const logoutElements = document.querySelectorAll('.logout-required');

    if (user) {
        // Show user name
        userNameElements.forEach(el => {
            el.textContent = user.name;
        });

        // Show elements that require login
        loginElements.forEach(el => {
            el.style.display = '';
        });

        // Hide elements that require logout
        logoutElements.forEach(el => {
            el.style.display = 'none';
        });
    } else {
        // Hide elements that require login
        loginElements.forEach(el => {
            el.style.display = 'none';
        });

        // Show elements that require logout
        logoutElements.forEach(el => {
            el.style.display = '';
        });
    }
}