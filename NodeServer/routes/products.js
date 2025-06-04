const express = require('express');
const router = express.Router();
const Product = require('../models/ProductPostgres');

// Get all products with pagination and sorting
router.get('/', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder ? req.query.sortOrder.toUpperCase() : 'ASC';
    
    // Calculate offset based on page
    const offset = (page - 1) * limit;

    const filters = {
      category: req.query.category || null,
      sort_by: sortBy,
      sort_order: sortOrder,
      limit: limit,
      offset: offset
    };

    const searchQuery = req.query.search || '';
    const products = await Product.search(searchQuery, filters);
    const totalCount = await Product.count(filters);
    
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      products: products.map(p => p.toJSON()),
      count: products.length,
      total: totalCount,
      pagination: {
        page: page,
        limit: limit,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.getCategories();
    res.json({
      success: true,
      categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Get subcategories by category ID
router.get('/categories/:categoryId/subcategories', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const subcategories = await Product.getSubcategories(categoryId);
    res.json({
      success: true,
      subcategories,
      count: subcategories.length
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subcategories'
    });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const filters = {
      category_id: req.query.category_id ? parseInt(req.query.category_id) : null,
      subcategory_id: req.query.subcategory_id ? parseInt(req.query.subcategory_id) : null,
      menu_eligible: req.query.menu_eligible === 'true',
      has_nutrition: req.query.has_nutrition === 'true',
      exclude_allergens: req.query.exclude_allergens ? 
        req.query.exclude_allergens.split(',').map(id => parseInt(id)) : null,
      sort_by: req.query.sort_by || 'name',
      sort_order: req.query.sort_order || 'ASC',
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const products = await Product.search(query, filters);
    const totalCount = await Product.count(filters);

    res.json({
      success: true,
      products: products.map(p => p.toJSON()),
      count: products.length,
      total: totalCount,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        has_more: (filters.offset + products.length) < totalCount
      }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search products'
    });
  }
});

// Get products by category
router.get('/category/:categoryName', async (req, res) => {
  try {
    const categoryName = req.params.categoryName;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const products = await Product.findByCategory(categoryName, limit, offset);
    const totalCount = await Product.count({ 
      category_id: products[0]?.category_id 
    });

    res.json({
      success: true,
      products: products.map(p => p.toJSON()),
      category: categoryName,
      count: products.length,
      total: totalCount,
      pagination: {
        limit,
        offset,
        has_more: (offset + products.length) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products by category'
    });
  }
});

// Get menu eligible products
router.get('/menu-eligible', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const products = await Product.getMenuEligible(limit, offset);
    const totalCount = await Product.count({ menu_eligible: true });

    res.json({
      success: true,
      products: products.map(p => p.toJSON()),
      count: products.length,
      total: totalCount,
      pagination: {
        limit,
        offset,
        has_more: (offset + products.length) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching menu eligible products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu eligible products'
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: product.toJSON()
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// Get product by item code
router.get('/item-code/:itemCode', async (req, res) => {
  try {
    const itemCode = req.params.itemCode;
    const product = await Product.findByItemCode(itemCode);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: product.toJSON()
    });
  } catch (error) {
    console.error('Error fetching product by item code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// Get product with prices
router.get('/:id/prices', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const products = await Product.getProductsWithPrices([productId]);

    if (!products[0]) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const product = products[0];
    res.json({
      success: true,
      product: product.toJSON(),
      prices: product.prices
    });
  } catch (error) {
    console.error('Error fetching product prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product prices'
    });
  }
});

// Compare prices for multiple products
router.post('/compare-prices', async (req, res) => {
  try {
    const { product_ids } = req.body;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'product_ids must be a non-empty array'
      });
    }

    const products = await Product.getProductsWithPrices(product_ids);

    res.json({
      success: true,
      products: products.map(p => ({
        ...p.toJSON(),
        prices: p.prices
      })),
      count: products.length
    });
  } catch (error) {
    console.error('Error comparing product prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare product prices'
    });
  }
});

// Update product images (for future use)
router.patch('/:id/images', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { images } = req.body;

    if (!images || typeof images !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Images object is required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const success = await product.updateImages(images);
    if (success) {
      res.json({
        success: true,
        product: product.toJSON()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update product images'
      });
    }
  } catch (error) {
    console.error('Error updating product images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product images'
    });
  }
});

module.exports = router; 