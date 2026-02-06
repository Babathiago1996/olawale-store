const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

class CloudinaryService {
  constructor() {
    this.configured = false;
    this.configure();
  }

  configure() {
    if (this.configured) return;

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    this.configured = true;
    console.log('✅ Cloudinary configured');
  }

  /**
   * Upload image from buffer
   */
  async uploadFromBuffer(buffer, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder || 'olawale-store',
        resource_type: 'image',
        transformation: options.transformation || [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        ...options
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes
            });
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload single image
   */
  async uploadImage(file, folder = 'items') {
    try {
      const options = {
        folder: `olawale-store/${folder}`,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      };

      const result = await this.uploadFromBuffer(file.buffer, options);
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Image upload failed');
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(files, folder = 'items') {
    try {
      const uploadPromises = files.map(file => 
        this.uploadImage(file, folder)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple images upload error:', error);
      throw new Error('Images upload failed');
    }
  }

  /**
   * Upload thumbnail
   */
  async uploadThumbnail(file, folder = 'thumbnails') {
    try {
      const options = {
        folder: `olawale-store/${folder}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      };

      const result = await this.uploadFromBuffer(file.buffer, options);
      return result;
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      throw new Error('Thumbnail upload failed');
    }
  }

  /**
   * Delete image
   */
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Image deletion failed');
    }
  }

  /**
   * Delete multiple images
   */
  async deleteMultipleImages(publicIds) {
    try {
      const deletePromises = publicIds.map(publicId => 
        this.deleteImage(publicId)
      );
      return await Promise.all(deletePromises);
    } catch (error) {
      console.error('Multiple images deletion error:', error);
      throw new Error('Images deletion failed');
    }
  }

  /**
   * Get image details
   */
  async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        createdAt: result.created_at
      };
    } catch (error) {
      console.error('Get image details error:', error);
      throw new Error('Failed to get image details');
    }
  }

  /**
   * Generate signed upload URL
   */
  generateSignedUploadUrl(folder = 'items', publicId = null) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      folder: `olawale-store/${folder}`,
      transformation: 'w_1200,h_1200,c_limit,q_auto:good,f_auto'
    };

    if (publicId) {
      params.public_id = publicId;
    }

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: params.folder,
      transformation: params.transformation
    };
  }

  /**
   * Create responsive image URLs
   */
  getResponsiveUrls(publicId) {
    const baseUrl = cloudinary.url(publicId, {
      secure: true,
      quality: 'auto:good',
      fetch_format: 'auto'
    });

    return {
      thumbnail: cloudinary.url(publicId, {
        width: 200,
        height: 200,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto:good',
        fetch_format: 'auto',
        secure: true
      }),
      small: cloudinary.url(publicId, {
        width: 400,
        height: 400,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto',
        secure: true
      }),
      medium: cloudinary.url(publicId, {
        width: 800,
        height: 800,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto',
        secure: true
      }),
      large: cloudinary.url(publicId, {
        width: 1200,
        height: 1200,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto',
        secure: true
      }),
      original: baseUrl
    };
  }

  /**
   * Optimize existing image
   */
  async optimizeImage(publicId) {
    try {
      const result = await cloudinary.uploader.explicit(publicId, {
        type: 'upload',
        eager: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }
        ]
      });
      return result.eager[0].secure_url;
    } catch (error) {
      console.error('Image optimization error:', error);
      throw new Error('Image optimization failed');
    }
  }

  /**
   * Get folder contents
   */
  async getFolderContents(folder = 'items', maxResults = 100) {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: `olawale-store/${folder}`,
        max_results: maxResults
      });
      return result.resources.map(resource => ({
        url: resource.secure_url,
        publicId: resource.public_id,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        bytes: resource.bytes,
        createdAt: resource.created_at
      }));
    } catch (error) {
      console.error('Get folder contents error:', error);
      throw new Error('Failed to get folder contents');
    }
  }

  /**
   * Search images by tag
   */
  async searchByTag(tag, maxResults = 50) {
    try {
      const result = await cloudinary.search
        .expression(`tags=${tag}`)
        .max_results(maxResults)
        .execute();
      
      return result.resources.map(resource => ({
        url: resource.secure_url,
        publicId: resource.public_id,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        bytes: resource.bytes,
        createdAt: resource.created_at
      }));
    } catch (error) {
      console.error('Search by tag error:', error);
      throw new Error('Image search failed');
    }
  }
}

module.exports = new CloudinaryService();