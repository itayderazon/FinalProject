const Product = require('../models/ProductPostgres');
const PythonService = require('../services/pythonService');

class CartController {
  // In-memory cart storage (replace with database in production)
  static carts = new Map();

  // Get or create cart for user
  static getCart(userId) {
    if (!CartController.carts.has(userId)) {
      CartController.carts.set(userId, {
        userId,
        items: [],
        updatedAt: new Date()
      });
    }
    return CartController.carts.get(userId);
  }

  // Add item to cart
  static async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { productId, quantity = 1 } = req.body;

      console.log('addToCart called with:', { userId, productId, quantity, productIdType: typeof productId });

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }

      // Verify product exists
      const product = await Product.findById(productId);
      console.log('Product found:', product ? { id: product.id, name: product.name, item_code: product.item_code } : 'null');
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      const cart = CartController.getCart(userId);
      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

      if (existingItemIndex > -1) {
        // Update existing item quantity
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({
          productId,
          quantity,
          addedAt: new Date()
        });
      }

      cart.updatedAt = new Date();

      res.json({
        success: true,
        message: 'Product added to cart',
        cart: {
          itemCount: cart.items.length,
          totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add product to cart'
      });
    }
  }

  // Remove item from cart
  static async removeFromCart(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const cart = CartController.getCart(userId);
      cart.items = cart.items.filter(item => item.productId !== productId);
      cart.updatedAt = new Date();

      res.json({
        success: true,
        message: 'Product removed from cart',
        cart: {
          itemCount: cart.items.length,
          totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove product from cart'
      });
    }
  }

  // Update item quantity
  static async updateQuantity(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be at least 1'
        });
      }

      const cart = CartController.getCart(userId);
      const itemIndex = cart.items.findIndex(item => item.productId === productId);

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Item not found in cart'
        });
      }

      cart.items[itemIndex].quantity = quantity;
      cart.updatedAt = new Date();

      res.json({
        success: true,
        message: 'Quantity updated',
        cart: {
          itemCount: cart.items.length,
          totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update quantity'
      });
    }
  }

  // Get cart with full product details
  static async getCartDetails(req, res) {
    try {
      const userId = req.user.id;
      const cart = CartController.getCart(userId);

      console.log('getCartDetails for userId:', userId);
      console.log('Cart contents:', { itemCount: cart.items.length, items: cart.items });

      // Get full product details for all cart items
      const cartItemsWithDetails = await Promise.all(
        cart.items.map(async (item) => {
          console.log('Looking up product with ID:', item.productId, 'type:', typeof item.productId);
          const product = await Product.findById(item.productId);
          console.log('Product lookup result:', product ? { id: product.id, name: product.name } : 'null');
          return {
            ...item,
            product: product ? product.toJSON() : null
          };
        })
      );

      // Filter out items where product no longer exists
      const validItems = cartItemsWithDetails.filter(item => item.product !== null);

      res.json({
        success: true,
        cart: {
          userId: cart.userId,
          items: validItems,
          itemCount: validItems.length,
          totalItems: validItems.reduce((sum, item) => sum + item.quantity, 0),
          updatedAt: cart.updatedAt
        }
      });
    } catch (error) {
      console.error('Error getting cart details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get cart details'
      });
    }
  }

  // Clear entire cart
  static async clearCart(req, res) {
    try {
      const userId = req.user.id;
      CartController.carts.set(userId, {
        userId,
        items: [],
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cart'
      });
    }
  }

  // Compare prices for cart items
  static async comparePrices(req, res) {
    try {
      const userId = req.user.id;
      const cart = CartController.getCart(userId);

      if (cart.items.length === 0) {
        return res.json({
          success: true,
          comparison: {
            stores: [],
            total: 0,
            savings: {}
          }
        });
      }

      // Get full product details
      const cartItemsWithDetails = await Promise.all(
        cart.items.map(async (item) => {
          const product = await Product.findById(item.productId);
          console.log('Cart item product details:', {
            productId: item.productId,
            product: product ? {
              id: product.id,
              item_code: product.item_code,
              name: product.name
            } : null,
            quantity: item.quantity
          });
          return {
            item_code: product.item_code,
            portion_grams: 100, // Default portion for price comparison
            name: product.name,
            quantity: item.quantity
          };
        })
      );

      console.log('Cart items formatted for price comparison:', cartItemsWithDetails);

      // Use existing price comparison service
      const priceComparison = await PythonService.comparePrices(cartItemsWithDetails);
      
      // Calculate totals by store
      const storeComparison = CartController.calculateStoreTotals(cartItemsWithDetails, priceComparison);

      console.log('Final comparison result being sent to frontend:', JSON.stringify(storeComparison, null, 2));

      res.json({
        success: true,
        comparison: storeComparison,
        items: cartItemsWithDetails.length
      });
    } catch (error) {
      console.error('Error comparing cart prices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to compare prices'
      });
    }
  }

  // Helper method to calculate store totals
  static calculateStoreTotals(cartItems, priceData) {
    console.log('calculateStoreTotals called with priceData:', priceData);
    
    const stores = {};
    let cheapestStore = null;
    let cheapestTotal = Infinity;

    // Check if we have the correct data structure from Python server
    if (priceData && priceData.price_comparison && priceData.price_comparison.supermarket_totals) {
      const { supermarket_totals, item_breakdown, available_supermarkets } = priceData.price_comparison;
      
      console.log('supermarket_totals:', supermarket_totals);
      console.log('item_breakdown:', item_breakdown);

      // Initialize stores from supermarket totals (these are already calculated by Python server)
      available_supermarkets.forEach(storeName => {
        stores[storeName] = {
          name: storeName,
          total: supermarket_totals[storeName] || 0,
          items: [],
          available_items: 0,
          missing_items: 0
        };
      });

      // Calculate item-level details for each store
      cartItems.forEach(item => {
        const itemData = item_breakdown.find(breakdown => breakdown.item_code === item.item_code);
        
        if (itemData && itemData.prices_per_supermarket) {
          available_supermarkets.forEach(storeName => {
            const store = stores[storeName];
            const itemPrice = itemData.prices_per_supermarket[storeName];
            
            if (itemPrice !== null && itemPrice !== undefined) {
              // Item is available in this store
              store.items.push({
                name: item.name,
                quantity: item.quantity,
                unit_price: itemPrice,
                total_price: itemPrice * item.quantity
              });
              store.available_items++;
            } else {
              // Item not available in this store
              store.missing_items++;
            }
          });
        } else {
          // Item not found in breakdown, mark as missing for all stores
          available_supermarkets.forEach(storeName => {
            stores[storeName].missing_items++;
          });
        }
      });

      // Find cheapest store (only consider stores with all items available)
      Object.values(stores).forEach(store => {
        if (store.total > 0 && store.missing_items === 0 && store.total < cheapestTotal) {
          cheapestTotal = store.total;
          cheapestStore = store.name;
        }
      });

      console.log('Processed stores:', stores);
      console.log('Cheapest store:', cheapestStore, 'with total:', cheapestTotal);
    }

    return {
      stores: Object.values(stores),
      cheapest_store: cheapestStore,
      cheapest_total: cheapestTotal === Infinity ? 0 : cheapestTotal,
      total_items: cartItems.length
    };
  }
}

module.exports = CartController; 