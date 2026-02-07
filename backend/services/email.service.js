const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.configure();
  }

  configure() {
    // ✅ FIXED: Support both Gmail and SendGrid
    const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
    
    if (emailProvider === 'sendgrid') {
      // SendGrid configuration (RECOMMENDED FOR PRODUCTION)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey', // This is literal 'apikey' for SendGrid
          pass: process.env.SENDGRID_API_KEY
        }
      });
      console.log('✅ Email service configured with SendGrid');
    } else {
      // Gmail configuration (for development/testing)
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // Use TLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        // ✅ CRITICAL: Add these for production
        tls: {
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2'
        }
      });
      console.log('✅ Email service configured with Gmail');
    }
  }

  /**
   * Send password reset OTP email
   */
  async sendPasswordResetOTP(email, otp, firstName) {
    try {
      const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      
      if (!from) {
        console.error('❌ EMAIL_FROM not configured');
        throw new Error('Email service not configured properly');
      }

      const mailOptions = {
        from: `"StockMaster Inventory" <${from}>`,
        to: email,
        subject: 'Password Reset OTP - StockMaster',
        html: this.getPasswordResetOTPTemplate(otp, firstName)
      };

      console.log(`📧 Sending password reset OTP to ${email}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset OTP sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      // ✅ Don't throw error in production - log and continue
      if (process.env.NODE_ENV === 'production') {
        console.error('Email failed but continuing...');
        return null;
      }
      throw error;
    }
  }

  /**
   * Send low stock alert email
   */
  async sendLowStockAlert(email, itemName, currentStock, threshold) {
    try {
      const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      
      if (!from) {
        console.error('❌ EMAIL_FROM not configured');
        return null;
      }

      const mailOptions = {
        from: `"StockMaster Alerts" <${from}>`,
        to: email,
        subject: `⚠️ Low Stock Alert: ${itemName}`,
        html: this.getLowStockAlertTemplate(itemName, currentStock, threshold)
      };

      console.log(`📧 Sending low stock alert to ${email} for ${itemName}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Low stock alert sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Low stock email error:', error.message);
      return null; // Don't crash the app if email fails
    }
  }

  /**
   * Send out of stock alert email
   */
  async sendOutOfStockAlert(email, itemName, sku) {
    try {
      const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      
      if (!from) {
        console.error('❌ EMAIL_FROM not configured');
        return null;
      }

      const mailOptions = {
        from: `"StockMaster Alerts" <${from}>`,
        to: email,
        subject: `🚨 OUT OF STOCK: ${itemName}`,
        html: this.getOutOfStockAlertTemplate(itemName, sku)
      };

      console.log(`📧 Sending out of stock alert to ${email} for ${itemName}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Out of stock alert sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Out of stock email error:', error.message);
      return null;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, firstName) {
    try {
      const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      
      if (!from) {
        console.error('❌ EMAIL_FROM not configured');
        return null;
      }

      const mailOptions = {
        from: `"StockMaster Team" <${from}>`,
        to: email,
        subject: '🎉 Welcome to StockMaster',
        html: this.getWelcomeTemplate(firstName)
      };

      console.log(`📧 Sending welcome email to ${email}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Welcome email error:', error.message);
      return null;
    }
  }

  /**
   * Password reset OTP email template
   */
  getPasswordResetOTPTemplate(otp, firstName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .otp-box { background: white; border: 2px solid #10b981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            <p>We received a request to reset your password for your StockMaster account.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              If you didn't request this password reset, please ignore this email and ensure your account is secure.
            </div>
            <p>Best regards,<br>StockMaster Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} StockMaster. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Low stock alert email template
   */
  getLowStockAlertTemplate(itemName, currentStock, threshold) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .alert-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .stat { text-align: center; padding: 15px; background: white; border-radius: 8px; }
          .stat-value { font-size: 32px; font-weight: bold; color: #f59e0b; }
          .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Stock Alert</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <h2 style="margin-top: 0; color: #f59e0b;">Stock Running Low!</h2>
              <p><strong>${itemName}</strong> is running low on stock.</p>
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${currentStock}</div>
                  <div class="stat-label">Current Stock</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${threshold}</div>
                  <div class="stat-label">Threshold</div>
                </div>
              </div>
            </div>
            <p><strong>Action Required:</strong> Please restock this item soon to avoid running out of stock.</p>
            <p>Best regards,<br>StockMaster System</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} StockMaster. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Out of stock alert email template
   */
  getOutOfStockAlertTemplate(itemName, sku) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .alert-box { background: #fef2f2; border: 2px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .urgent { background: #ef4444; color: white; padding: 10px 20px; border-radius: 6px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 OUT OF STOCK ALERT</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <h2 style="margin-top: 0; color: #ef4444;">Critical: Item Out of Stock!</h2>
              <p><strong>${itemName}</strong></p>
              <p>SKU: <code style="background: #fee; padding: 2px 8px; border-radius: 4px;">${sku}</code></p>
              <div class="urgent">⚠️ URGENT ACTION REQUIRED</div>
            </div>
            <p><strong>Immediate Action Required:</strong> This item needs to be restocked urgently to avoid lost sales.</p>
            <p>Best regards,<br>StockMaster System</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} StockMaster. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Welcome email template
   */
  getWelcomeTemplate(firstName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to StockMaster!</h1>
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            <p>Welcome to StockMaster Inventory Management System!</p>
            <p>Your account has been successfully created. You can now start managing your inventory efficiently.</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>StockMaster Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} StockMaster. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Test email connection
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      console.error('Check your EMAIL_USER and EMAIL_PASSWORD environment variables');
      return false;
    }
  }
}

module.exports = new EmailService();