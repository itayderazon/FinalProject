const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class FileService {
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') { // File not found is OK
        logger.error(`Error deleting file ${filePath}:`, error);
        throw error;
      }
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error(`Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }

  async getFileStats(filePath) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      logger.error(`Error getting file stats ${filePath}:`, error);
      throw error;
    }
  }

  async moveFile(oldPath, newPath) {
    try {
      await fs.rename(oldPath, newPath);
      logger.info(`File moved from ${oldPath} to ${newPath}`);
    } catch (error) {
      logger.error(`Error moving file from ${oldPath} to ${newPath}:`, error);
      throw error;
    }
  }
}

module.exports = new FileService();