const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const env = require('../config/env');

class ImageService {
  constructor() {
    // Initialize Supabase client
    this.supabaseUrl = env.SUPABASE_URL;
    this.supabaseKey = env.SUPABASE_ANON_KEY;
    this.bucketName = env.SUPABASE_STORAGE_BUCKET;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      logger.error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
      this.supabase = null;
    } else {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      logger.info('Supabase client initialized for image service');
    }
  }

  isConfigured() {
    return this.supabase !== null;
  }

  generateImagePath(itemCode, imageType = 'small') {
    // Handle the actual image format in your bucket: .webp files with _small or _trim suffixes
    return `images/${itemCode}_${imageType}.webp`;
  }

  getPublicImageUrl(itemCode, imageType = 'small') {
    if (!this.isConfigured()) {
      logger.warn('Supabase not configured, cannot generate image URL');
      return null;
    }

    try {
      const imagePath = this.generateImagePath(itemCode, imageType);
      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(imagePath);
      
      return data.publicUrl;
    } catch (error) {
      logger.error('Error generating public URL:', error);
      return null;
    }
  }

  async checkImageExists(itemCode, imageType = 'small') {
    if (!this.isConfigured()) {
      logger.warn('Supabase not configured, cannot check image existence');
      return false;
    }

    try {
      const imagePath = this.generateImagePath(itemCode, imageType);
      
      // Try to get file info
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('images', {
          search: `${itemCode}_${imageType}.webp`,
          limit: 1
        });

      if (error) {
        logger.error('Error checking image existence:', error);
        return false;
      }

      // Check if the file was found
      const fileName = `${itemCode}_${imageType}.webp`;
      const fileExists = data && data.length > 0 && data.some(file => file.name === fileName);
      
      logger.info(`Image ${imagePath} exists: ${fileExists}`);
      return fileExists;
    } catch (error) {
      logger.error('Error checking image existence:', error);
      return false;
    }
  }

  async testConnection() {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Supabase not configured. Missing SUPABASE_URL or SUPABASE_ANON_KEY'
      };
    }

    try {
      // Try to list files in the bucket (just first few)
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          limit: 1
        });

      if (error) {
        return {
          success: false,
          message: `Supabase storage error: ${error.message}`
        };
      }

      return {
        success: true,
        message: `Successfully connected to Supabase storage bucket: ${this.bucketName}`,
        bucketName: this.bucketName,
        filesFound: data ? data.length : 0
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }

  getConfig() {
    return {
      supabaseUrl: this.supabaseUrl ? `${this.supabaseUrl.substring(0, 20)}...` : 'Not set',
      supabaseKey: this.supabaseKey ? 'Set' : 'Not set',
      bucketName: this.bucketName,
      isConfigured: this.isConfigured()
    };
  }
}

module.exports = new ImageService(); 