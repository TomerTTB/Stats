const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Minimal server is working' });
});

// Default route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log('=================================');
    console.log(`Minimal server is running on port ${port}`);
    console.log('=================================');
});

console.log('Server startup initiated...'); 