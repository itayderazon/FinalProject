const express = require('express');
const router = express.Router();
const imageService = require('../services/imageService');
const logger = require('../utils/logger');

// Test the image service configuration
router.get('/test', async (req, res) => {
  try {
    logger.info('Testing image service configuration...');
    
    const config = imageService.getConfig();
    const connectionTest = await imageService.testConnection();
    
    res.json({
      success: true,
      message: 'Image service test endpoint',
      config,
      connectionTest
    });
  } catch (error) {
    logger.error('Error testing image service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test image service',
      details: error.message
    });
  }
});

// Get image URL for a specific product by item code
router.get('/product/:itemCode', async (req, res) => {
  try {
    const { itemCode } = req.params;
    const { type = 'small' } = req.query; // Support both 'small' and 'trim' via query parameter
    
    if (!itemCode) {
      return res.status(400).json({
        success: false,
        error: 'Item code is required'
      });
    }

    // Validate image type
    if (!['small', 'trim'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Image type must be either "small" or "trim"'
      });
    }

    logger.info(`Getting ${type} image URL for item code: ${itemCode}`);
    
    // Get the public URL for the specified type
    const imageUrl = imageService.getPublicImageUrl(itemCode, type);
    
    if (!imageUrl) {
      return res.json({
        success: true,
        itemCode,
        imageType: type,
        imageUrl: null,
        message: 'Image service not configured or item code invalid'
      });
    }

    // Check if the image actually exists
    const exists = await imageService.checkImageExists(itemCode, type);
    
    res.json({
      success: true,
      itemCode,
      imageType: type,
      imageUrl,
      exists,
      message: exists ? 'Image found' : 'Image URL generated but file may not exist'
    });
  } catch (error) {
    logger.error('Error getting product image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product image',
      details: error.message
    });
  }
});

// Check if image exists for a product (simple check)
router.get('/product/:itemCode/exists', async (req, res) => {
  try {
    const { itemCode } = req.params;
    const { type = 'small' } = req.query;
    
    if (!itemCode) {
      return res.status(400).json({
        success: false,
        error: 'Item code is required'
      });
    }

    // Validate image type
    if (!['small', 'trim'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Image type must be either "small" or "trim"'
      });
    }

    logger.info(`Checking if ${type} image exists for item code: ${itemCode}`);
    
    const exists = await imageService.checkImageExists(itemCode, type);
    const imageUrl = exists ? imageService.getPublicImageUrl(itemCode, type) : null;
    
    res.json({
      success: true,
      itemCode,
      imageType: type,
      exists,
      imageUrl
    });
  } catch (error) {
    logger.error('Error checking image existence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check image existence',
      details: error.message
    });
  }
});

// Get both image types for a product
router.get('/product/:itemCode/all', async (req, res) => {
  try {
    const { itemCode } = req.params;
    
    if (!itemCode) {
      return res.status(400).json({
        success: false,
        error: 'Item code is required'
      });
    }

    logger.info(`Getting all images for item code: ${itemCode}`);
    
    // Check both image types
    const [smallExists, trimExists] = await Promise.all([
      imageService.checkImageExists(itemCode, 'small'),
      imageService.checkImageExists(itemCode, 'trim')
    ]);
    
    const response = {
      success: true,
      itemCode,
      images: {
        small: {
          exists: smallExists,
          url: smallExists ? imageService.getPublicImageUrl(itemCode, 'small') : null
        },
        trim: {
          exists: trimExists,
          url: trimExists ? imageService.getPublicImageUrl(itemCode, 'trim') : null
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Error getting all product images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product images',
      details: error.message
    });
  }
});

module.exports = router; 