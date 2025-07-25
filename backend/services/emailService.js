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
      console.log('Subject: Password Reset Request - TTA Learning Platform');
      console.log('Reset URL:', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
      console.log('User:', userName);
      return true;
    }
    
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@yourdomain.com',
      to: email,
      subject: 'Password Reset Request - TTA Learning Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <img src="data:image/svg+xml;base64,${Buffer.from(`<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" id="Calque_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 1233.35 197.9" style="enable-background:new 0 0 1233.35 197.9;" xml:space="preserve">
<style type="text/css">
	.st0{fill:#FFFFFF;}
	.st1{fill:#263678;}
	.st2{fill:#98BBE4;}
	.st3{fill:#27357A;}
	.st4{fill:#4C85C5;}
	.st5{fill:#2C51A0;}
	.st6{clip-path:url(#SVGID_2_);fill:url(#SVGID_3_);}
</style>
<g>
	<path class="st3" d="M769.75,46.1L769.75,46.1h-21.52V30.55h5.97C762.79,30.55,769.75,37.52,769.75,46.1"/>
	<path class="st3" d="M810.42,30.55V46.1h-21.44v62.28h-19.23V46.1c0-8.59,6.96-15.55,15.55-15.55H810.42z"/>
	<path class="st3" d="M1008.54,46.1L1008.54,46.1h-21.52V30.55h5.97C1001.57,30.55,1008.54,37.52,1008.54,46.1"/>
	<path class="st3" d="M1049.21,30.55V46.1h-21.44v62.28h-19.23V46.1c0-8.59,6.96-15.55,15.55-15.55H1049.21z"/>
	<path class="st3" d="M822.48,97.78c3.53,3.57,7.84,6.4,12.8,8.42c4.96,2.02,10.52,3.04,16.54,3.04c6.01,0,11.57-1.02,16.51-3.04
		c4.95-2.02,9.24-4.86,12.75-8.42c3.51-3.56,6.28-7.82,8.21-12.65c1.93-4.83,2.91-10.11,2.91-15.69c0-5.55-0.98-10.81-2.91-15.64
		c-1.94-4.83-4.7-9.07-8.21-12.62c-3.51-3.55-7.8-6.38-12.75-8.42c-4.94-2.04-10.5-3.07-16.51-3.07c-6.01,0-11.57,1.02-16.54,3.04
		c-4.97,2.02-9.27,4.85-12.8,8.39c-3.53,3.55-6.3,7.8-8.24,12.62c-1.93,4.82-2.91,10.1-2.91,15.69c0,5.6,0.98,10.88,2.91,15.69
		C816.17,89.96,818.94,94.22,822.48,97.78 M851.82,45.8c3.27,0,6.23,0.55,8.78,1.62c2.54,1.07,4.72,2.63,6.47,4.63
		c1.76,2.02,3.13,4.51,4.07,7.42c0.95,2.93,1.43,6.29,1.43,9.97c0,3.72-0.48,7.09-1.43,10.02c-0.94,2.91-2.31,5.41-4.07,7.42
		c-1.75,2-3.93,3.55-6.47,4.6c-2.55,1.06-5.51,1.6-8.79,1.6c-3.31,0-6.29-0.54-8.87-1.6c-2.56-1.05-4.74-2.6-6.49-4.6
		c-1.76-2.01-3.13-4.51-4.07-7.42c-0.95-2.94-1.43-6.32-1.43-10.02c0-3.67,0.48-7.03,1.43-9.97c0.94-2.91,2.32-5.41,4.07-7.42
		c1.75-2,3.94-3.55,6.49-4.63C845.52,46.34,848.51,45.8,851.82,45.8"/>
	<path class="st3" d="M958.6,66.98c1.25-3.25,1.89-6.87,1.89-10.75c0-3.61-0.62-7.02-1.83-10.13c-1.23-3.13-3.15-5.89-5.73-8.2
		c-2.56-2.3-5.86-4.12-9.81-5.42c-3.92-1.3-8.66-1.95-14.1-1.95h-27.7v77.89h19.21V82.87h8.49c5.34,0,10.03-0.65,13.95-1.95
		c3.94-1.3,7.25-3.14,9.83-5.48C955.39,73.11,957.34,70.27,958.6,66.98 M929.02,68.02h-8.49V45.28h8.49c2.14,0,4.01,0.27,5.55,0.8
		c1.51,0.52,2.78,1.26,3.77,2.22c0.98,0.95,1.72,2.1,2.2,3.42c0.49,1.35,0.74,2.87,0.74,4.52c0,3.74-0.96,6.68-2.84,8.73
		C936.56,66.99,933.4,68.02,929.02,68.02"/>
	<rect x="1056.59" y="30.53" class="st3" width="19.32" height="77.89"/>
	<polygon class="st3" points="1140.52,93.3 1109.16,93.3 1109.16,76.58 1133.18,76.58 1133.18,61.99 1109.16,61.99 1109.16,45.64 
		1140.52,45.64 1140.52,30.53 1089.85,30.53 1089.85,108.41 1140.52,108.41 	"/>
	<path class="st3" d="M1170.21,80.15h3.76c1.23,0,2.17,0.18,2.82,0.54c0.63,0.35,1.19,0.96,1.68,1.82l12.69,22.18
		c1.43,2.47,3.79,3.73,7.04,3.73h17.37l-16.94-27.72c-0.81-1.32-1.77-2.46-2.85-3.38c-0.67-0.57-1.38-1.08-2.11-1.54
		c1.96-0.86,3.75-1.92,5.33-3.13c1.96-1.51,3.63-3.25,4.98-5.17c1.35-1.93,2.39-4.05,3.06-6.32c0.68-2.27,1.03-4.71,1.03-7.24
		c0-3.33-0.58-6.46-1.73-9.3c-1.16-2.86-3.04-5.38-5.59-7.48c-2.54-2.08-5.83-3.73-9.81-4.88c-3.95-1.15-8.77-1.73-14.34-1.73H1151
		v77.89h19.21V80.15z M1170.21,45.28h6.39c4.38,0,7.63,0.89,9.66,2.65c2.03,1.76,3.02,4.15,3.02,7.31c0,1.58-0.23,3.09-0.69,4.46
		c-0.45,1.34-1.19,2.52-2.18,3.51c-1.01,1-2.32,1.8-3.9,2.37c-1.61,0.58-3.6,0.87-5.91,0.87h-6.39V45.28z"/>
	<path class="st3" d="M786.51,127.85h-17.12l-26.83,69.3h13.37c1.46,0,2.73-0.41,3.76-1.2c1.01-0.79,1.7-1.69,2.06-2.7l3.83-11.32
		h24.73l3.83,11.32c0.39,1.14,1.09,2.08,2.1,2.8c1.01,0.73,2.29,1.09,3.81,1.09h13.28l-26.65-68.83L786.51,127.85z M777.11,148.04
		c0.29-0.89,0.58-1.82,0.86-2.78c0.29,0.95,0.58,1.86,0.88,2.72l7.33,21.76h-16.47l5.9-17.47
		C776.08,151.09,776.58,149.67,777.11,148.04"/>
	<path class="st3" d="M834.37,147.17c1.61-1.79,3.57-3.18,5.81-4.14c2.26-0.97,4.79-1.45,7.53-1.45c1.58,0,2.98,0.12,4.16,0.36
		c1.18,0.24,2.22,0.54,3.09,0.87c0.86,0.34,1.62,0.71,2.25,1.1l1.83,1.16c0.58,0.37,1.13,0.69,1.65,0.95
		c1.49,0.74,3.33,0.52,4.32-0.24c0.52-0.39,0.97-0.84,1.35-1.33l5.68-7.62l-0.43-0.45c-1.3-1.37-2.81-2.63-4.5-3.76
		c-1.68-1.13-3.54-2.11-5.53-2.91c-1.99-0.81-4.16-1.45-6.44-1.9c-2.29-0.46-4.76-0.69-7.34-0.69c-5.31,0-10.24,0.88-14.66,2.61
		c-4.42,1.74-8.27,4.2-11.45,7.33c-3.18,3.13-5.68,6.91-7.44,11.21c-1.77,4.3-2.67,9.08-2.67,14.23c0,5.03,0.79,9.75,2.33,14.05
		c1.55,4.31,3.79,8.09,6.69,11.24c2.9,3.15,6.48,5.66,10.63,7.44c4.15,1.78,8.91,2.69,14.14,2.69c5.69,0,10.7-0.94,14.89-2.79
		c4.21-1.86,7.76-4.65,10.55-8.3l0.38-0.5l-6.69-7.04c-0.42-0.42-0.87-0.71-1.34-0.89c-1.02-0.38-2.08-0.33-3.04,0.12
		c-0.48,0.22-0.95,0.52-1.38,0.88c-0.89,0.77-1.78,1.42-2.66,1.95c-0.87,0.52-1.79,0.94-2.75,1.26c-0.95,0.32-2,0.55-3.13,0.68
		c-1.14,0.14-2.43,0.21-3.82,0.21c-2.37,0-4.62-0.47-6.68-1.38c-2.07-0.91-3.9-2.27-5.45-4.03c-1.56-1.76-2.81-3.97-3.72-6.57
		c-0.91-2.6-1.38-5.64-1.38-9.02c0-3.22,0.46-6.17,1.37-8.74C831.47,151.18,832.75,148.97,834.37,147.17"/>
	<path class="st3" d="M916,127.85h-17.12l-26.83,69.3h13.37c1.46,0,2.73-0.41,3.76-1.2c1.01-0.79,1.7-1.69,2.06-2.7l3.83-11.32
		h24.73l3.83,11.32c0.39,1.14,1.1,2.08,2.1,2.8c1.02,0.73,2.29,1.09,3.81,1.09h13.28l-26.65-68.83L916,127.85z M906.61,148.04
		c0.29-0.89,0.58-1.82,0.86-2.78c0.29,0.95,0.58,1.86,0.88,2.72l7.33,21.76h-16.46l5.89-17.47
		C905.58,151.09,906.08,149.67,906.61,148.04"/>
	<path class="st3" d="M1000.5,137.7c-3.13-3.07-6.95-5.5-11.35-7.24c-4.4-1.73-9.34-2.61-14.68-2.61h-27.09v69.3h27.09
		c5.34,0,10.28-0.87,14.68-2.59c4.4-1.72,8.22-4.15,11.35-7.24c3.13-3.08,5.59-6.78,7.31-11c1.72-4.21,2.59-8.87,2.59-13.85
		c0-4.95-0.88-9.59-2.59-13.8C1006.1,144.46,1003.64,140.76,1000.5,137.7 M974.48,183.57h-9.78v-42.14h9.78
		c2.89,0,5.5,0.49,7.76,1.45c2.24,0.96,4.16,2.35,5.71,4.13c1.55,1.79,2.77,4.01,3.6,6.61c0.84,2.61,1.27,5.59,1.27,8.85
		c0,3.29-0.42,6.29-1.27,8.9c-0.83,2.6-2.05,4.82-3.6,6.61c-1.55,1.79-3.47,3.18-5.71,4.13
		C979.98,183.08,977.36,183.57,974.48,183.57"/>
	<polygon class="st3" points="1018.34,197.15 1063.49,197.15 1063.49,183.57 1035.66,183.57 1035.66,168.9 1056.98,168.9 
		1056.98,155.78 1035.66,155.78 1035.66,141.43 1063.49,141.43 1063.49,127.85 1018.34,127.85 	"/>
	<path class="st3" d="M1134.23,128.18c-0.49,0.19-0.95,0.49-1.35,0.89c-0.38,0.38-0.74,0.9-1.09,1.56l-17.41,34.29
		c-0.63,1.22-1.24,2.48-1.83,3.78c-0.33,0.74-0.68,1.51-1.01,2.32c-0.31-0.76-0.64-1.51-0.97-2.24c-0.57-1.27-1.18-2.53-1.8-3.71
		l-17.46-34.44c-0.35-0.66-0.70-1.17-1.09-1.56c-0.4-0.4-0.86-0.7-1.35-0.89c-0.49-0.19-1.04-0.28-1.64-0.28h-14.54v69.26h15.35
		v-39.75c0-0.79-0.03-1.65-0.07-2.57l16.36,31.63c0.62,1.21,1.48,2.14,2.54,2.77c1.06,0.62,2.27,0.94,3.61,0.94h2.14
		c1.34,0,2.55-0.32,3.61-0.94c1.06-0.63,1.91-1.56,2.54-2.77l16.34-31.72c-0.04,0.92-0.06,1.81-0.06,2.66v39.75h15.36V127.9h-14.55
		C1135.28,127.9,1134.72,127.99,1134.23,128.18"/>
	<path class="st3" d="M1206.57,127.85c-0.73,0-1.42,0.12-2.05,0.35c-0.62,0.23-1.17,0.53-1.64,0.9c-0.46,0.36-0.88,0.76-1.24,1.22
		c-0.37,0.46-0.66,0.92-0.85,1.35l-9.5,19.74c-0.74,1.55-1.44,2.99-2.09,4.33c-0.37,0.77-0.72,1.53-1.03,2.3
		c-0.33-0.75-0.67-1.51-1.04-2.25l-11.74-24.12c-0.54-1.09-1.27-1.99-2.16-2.69c-0.94-0.74-2.19-1.11-3.72-1.11h-15.16l25.12,42.98
		v26.33h17.22v-26.33l25.13-42.98H1206.57z"/>
	<path class="st4" d="M296.82,0v98.94h-98.94v98.94H98.94V98.94c0-27.32,11.07-52.06,28.98-69.96C145.82,11.08,170.56,0,197.88,0
		H296.82z"/>
	<path class="st4" d="M494.69,0v98.94h-98.94v98.94h-98.94V98.94c0-27.32,11.07-52.06,28.98-69.96C343.7,11.08,368.44,0,395.76,0
		H494.69z"/>
	<polyline class="st4" points="395.76,98.94 395.76,197.88 296.82,197.88 	"/>
	<path class="st4" d="M98.94,98.94H0V0C54.64,0,98.94,44.3,98.94,98.94z"/>
	<rect x="494.69" y="98.94" class="st4" width="98.94" height="98.94"/>
	<rect x="593.64" y="98.94" class="st5" width="98.94" height="98.94"/>
	<path class="st5" d="M593.64,0v98.94h-98.94C494.69,44.3,538.99,0,593.64,0L593.64,0z"/>
	<path class="st4" d="M593.64,0v98.94h98.94C692.58,44.3,648.28,0,593.64,0L593.64,0z"/>
	<path class="st5" d="M197.88,98.94H98.94C98.94,44.3,143.24,0,197.88,0V98.94z"/>
	<path class="st5" d="M395.76,98.94h-98.94C296.82,44.3,341.11,0,395.76,0V98.94z"/>
	<path class="st3" d="M1220.51,33.72c-2.32,0-4.45-0.57-6.4-1.71c-1.95-1.14-3.5-2.68-4.66-4.61c-1.16-1.93-1.74-4.07-1.74-6.42
		c0-2.35,0.58-4.49,1.74-6.42c1.16-1.93,2.71-3.46,4.66-4.58c1.94-1.13,4.07-1.69,6.4-1.69c2.35,0,4.5,0.56,6.45,1.69
		c1.95,1.12,3.5,2.65,4.66,4.58c1.16,1.93,1.74,4.07,1.74,6.42c0,2.35-0.58,4.49-1.74,6.42c-1.16,1.93-2.71,3.46-4.66,4.61
		C1225.01,33.16,1222.86,33.72,1220.51,33.72 M1220.51,30.3c1.7,0,3.26-0.42,4.66-1.25c1.4-0.84,2.51-1.96,3.33-3.38
		c0.82-1.41,1.23-2.97,1.23-4.68c0-1.7-0.41-3.26-1.23-4.66c-0.82-1.4-1.93-2.52-3.33-3.35c-1.4-0.84-2.95-1.25-4.66-1.25
		c-1.67,0-3.21,0.42-4.61,1.25c-1.4,0.84-2.51,1.95-3.33,3.35c-0.81,1.4-1.23,2.95-1.23,4.66c0,1.71,0.41,3.27,1.23,4.68
		c0.82,1.42,1.93,2.54,3.33,3.38C1217.3,29.88,1218.84,30.3,1220.51,30.3 M1215.6,27.58V14.33h5.32c1.5,0,2.68,0.34,3.53,1.02
		c0.85,0.68,1.28,1.67,1.28,2.97c0,1.06-0.29,1.91-0.85,2.56s-1.34,1.09-2.33,1.33l3.69,5.37h-3.28l-2.86-4.2
		c-0.14-0.17-0.23-0.35-0.28-0.54c-0.06-0.19-0.12-0.33-0.18-0.44h-1.23v5.17H1215.6z M1218.41,19.96h2.14
		c1.47,0,2.21-0.53,2.21-1.59c0-1.06-0.74-1.59-2.21-1.59h-2.14V19.96z"/>
</g>
</svg>`).toString('base64')}" alt="TTA Logo" style="width: 200px; height: auto; margin-bottom: 15px;" />
            <h1 style="margin: 0; font-size: 28px;">TTA Learning Platform</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password for your TTA Learning Platform account. 
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
              The TTA Learning Platform Team
            </p>
          </div>
          
          <div style="background: #343a40; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              © 2024 TTA Learning Platform. All rights reserved.
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