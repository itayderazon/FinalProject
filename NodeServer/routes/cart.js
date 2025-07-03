const express = require('express');
const CartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all cart routes
router.use(authMiddleware.authenticate);

// Add product to cart
router.post('/add', CartController.addToCart);

// Remove product from cart
router.delete('/remove/:productId', CartController.removeFromCart);

// Update item quantity in cart
router.put('/update/:productId', CartController.updateQuantity);

// Get cart with full product details
router.get('/', CartController.getCartDetails);

// Clear entire cart
router.delete('/clear', CartController.clearCart);

// Compare prices for all cart items
router.get('/compare-prices', CartController.comparePrices);

module.exports = router; 