import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  // For development, use Gmail or a service like Mailtrap
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development configuration - using Gmail with app password
    // If you want to use Mailtrap for testing, uncomment the lines below
    // and comment out the Gmail configuration
    
    // Mailtrap configuration (for testing)
    if (process.env.USE_MAILTRAP === 'true') {
      return nodemailer.createTransport({
        host: 'smtp.mailtrap.io',
        port: 2525,
        auth: {
          user: process.env.MAILTRAP_USER || 'your-mailtrap-user',
          pass: process.env.MAILTRAP_PASS || 'your-mailtrap-pass'
        }
      });
    }
    
    // Gmail configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    // In development, optionally log instead of sending
    if (process.env.NODE_ENV === 'development' && process.env.LOG_EMAILS === 'true') {
      console.log('📧 EMAIL LOG (not sent):');
      console.log('To:', email);
      console.log('Subject: Password Reset Request - TTH Learning Platform');
      console.log('Reset URL:', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
      console.log('User:', userName);
      return true;
    }
    
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@yourdomain.com',
      to: email,
      subject: 'Password Reset Request - TTH Learning Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">TTH Learning Platform</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password for your TTH Learning Platform account. 
              If you didn't make this request, you can safely ignore this email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;">
                Reset Your Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              This link will expire in 1 hour for security reasons. If you need to reset your password again, 
              please visit the login page and click "Forgot Password".
            </p>
            
            <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #495057; font-size: 14px;">
                <strong>Security Note:</strong> If you didn't request this password reset, 
                please contact our support team immediately.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Best regards,<br>
              The TTH Learning Platform Team
            </p>
          </div>
          
          <div style="background: #343a40; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              © 2024 TTH Learning Platform. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send password reset email for SchoolHouse
export const sendSchoolHousePasswordResetEmail = async (email, resetToken, userName) => {
  try {
    // In development, optionally log instead of sending
    if (process.env.NODE_ENV === 'development' && process.env.LOG_EMAILS === 'true') {
      console.log('📧 EMAIL LOG (not sent):');
      console.log('To:', email);
      console.log('Subject: Password Reset Request - SchoolHouse');
      console.log('Reset URL:', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/schoolhouse/reset-password?token=${resetToken}`);
      console.log('User:', userName);
      return true;
    }
    
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/schoolhouse/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@yourdomain.com',
      to: email,
      subject: 'Password Reset Request - SchoolHouse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #3b82f6; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">SchoolHouse</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Course Management System</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password for your SchoolHouse account. 
              If you didn't make this request, you can safely ignore this email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #3b82f6; 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;">
                Reset Your Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              This link will expire in 1 hour for security reasons. If you need to reset your password again, 
              please visit the login page and click "Forgot Password".
            </p>
            
            <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #495057; font-size: 14px;">
                <strong>Security Note:</strong> If you didn't request this password reset, 
                please contact our support team immediately.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Best regards,<br>
              The SchoolHouse Team
            </p>
          </div>
          
          <div style="background: #343a40; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              © 2024 SchoolHouse. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('SchoolHouse password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending SchoolHouse password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}; 