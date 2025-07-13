import dotenv from 'dotenv';
import { sendPasswordResetEmail } from './backend/services/emailService.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend folder
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function testEmailConfig() {
  console.log('Testing email configuration...\n');
  
  console.log('Environment variables:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('USE_MAILTRAP:', process.env.USE_MAILTRAP);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('LOG_EMAILS:', process.env.LOG_EMAILS);
  
  if (process.env.USE_MAILTRAP === 'true') {
    console.log('MAILTRAP_USER:', process.env.MAILTRAP_USER ? 'Set' : 'Not set');
    console.log('MAILTRAP_PASS:', process.env.MAILTRAP_PASS ? 'Set' : 'Not set');
  } else {
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');
  }
  
  console.log('\nAttempting to send test email...');
  
  try {
    await sendPasswordResetEmail(
      process.env.EMAIL_USER, // Send to yourself for testing
      'test-token-123',
      'Test User'
    );
    console.log('✅ Email sent successfully!');
    console.log('Check your inbox (or Mailtrap inbox) for the test email.');
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 This usually means:');
      console.log('1. Gmail App Password is not set correctly');
      console.log('2. 2-Step Verification is not enabled');
      console.log('3. You\'re using your regular Gmail password instead of App Password');
    }
  }
}

testEmailConfig(); 