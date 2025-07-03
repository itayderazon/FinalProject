import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import cartService from '../services/cartService';

const useShoppingCart = () => {
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    totalItems: 0,
    updatedAt: null
  });
  const [loading, setLoading] = useState(false);
  const [priceComparison, setPriceComparison] = useState(null);
  const [comparingPrices, setComparingPrices] = useState(false);

  // Load cart on hook initialization
  useEffect(() => {
    loadCart();
  }, []);

  // Load cart from server
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (response.success) {
        setCart(response.cart);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item to cart
  const addToCart = useCallback(async (productId, quantity = 1) => {
    try {
      const response = await cartService.addToCart(productId, quantity);
      if (response.success) {
        await loadCart(); // Reload cart to get updated data
        toast.success('Product added to cart');
        return true;
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error(error.error || 'Failed to add product to cart');
      return false;
    }
  }, [loadCart]);

  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    try {
      const response = await cartService.removeFromCart(productId);
      if (response.success) {
        await loadCart(); // Reload cart to get updated data
        toast.success('Product removed from cart');
        return true;
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast.error(error.error || 'Failed to remove product from cart');
      return false;
    }
  }, [loadCart]);

  // Update item quantity
  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(productId);
    }

    try {
      const response = await cartService.updateQuantity(productId, quantity);
      if (response.success) {
        await loadCart(); // Reload cart to get updated data
        return true;
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error(error.error || 'Failed to update quantity');
      return false;
    }
  }, [loadCart, removeFromCart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      const response = await cartService.clearCart();
      if (response.success) {
        setCart({
          items: [],
          itemCount: 0,
          totalItems: 0,
          updatedAt: new Date()
        });
        setPriceComparison(null);
        toast.success('Cart cleared');
        return true;
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error(error.error || 'Failed to clear cart');
      return false;
    }
  }, []);

  // Compare prices for cart items
  const comparePrices = useCallback(async () => {
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      return null;
    }

    try {
      setComparingPrices(true);
      const response = await cartService.comparePrices();
      if (response.success) {
        setPriceComparison(response.comparison);
        return response.comparison;
      }
    } catch (error) {
      console.error('Failed to compare prices:', error);
      toast.error(error.error || 'Failed to compare prices');
      return null;
    } finally {
      setComparingPrices(false);
    }
  }, [cart.items.length]);

  // Check if product is in cart
  const isInCart = useCallback((productId) => {
    return cart.items.some(item => item.productId === productId);
  }, [cart.items]);

  // Get item quantity in cart
  const getItemQuantity = useCallback((productId) => {
    const item = cart.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  }, [cart.items]);

  // Calculate total items with quantities
  const getTotalItems = useCallback(() => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [cart.items]);

  return {
    // State
    cart,
    loading,
    priceComparison,
    comparingPrices,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    comparePrices,
    loadCart,
    
    // Helpers
    isInCart,
    getItemQuantity,
    getTotalItems
  };
};

export default useShoppingCart; 