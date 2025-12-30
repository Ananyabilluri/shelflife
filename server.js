const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve frontend files

// In-memory database (replace with MongoDB/MySQL in production)
let users = [];
let products = [];

// ==================== USER ROUTES ====================

// Register/Login user
app.post('/api/user/login', (req, res) => {
    const { name, email } = req.body;
    
    // Check if user exists
    let user = users.find(u => u.email === email);
    
    if (!user) {
        // Create new user
        user = {
            id: Date.now(),
            name,
            email,
            preference: null
        };
        users.push(user);
    }
    
    res.json({ success: true, user });
});

// Update user preference
app.post('/api/user/preference', (req, res) => {
    const { email, preference } = req.body;
    
    const user = users.find(u => u.email === email);
    if (user) {
        user.preference = preference;
        res.json({ success: true, user });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
});

// ==================== PRODUCT ROUTES ====================

// Get all products for a user
app.get('/api/products/:email', (req, res) => {
    const userProducts = products.filter(p => p.userEmail === req.params.email);
    res.json({ success: true, products: userProducts });
});

// Add new product
app.post('/api/products', (req, res) => {
    const { userEmail, name, expiryDate } = req.body;
    
    const product = {
        id: Date.now(),
        userEmail,
        name,
        expiryDate,
        createdAt: new Date()
    };
    
    products.push(product);
    res.json({ success: true, product });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    products = products.filter(p => p.id !== id);
    res.json({ success: true, message: 'Product deleted' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});