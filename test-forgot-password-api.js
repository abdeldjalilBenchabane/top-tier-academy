import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend folder
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function testForgotPasswordAPI() {
  console.log('Testing forgot password API endpoint...\n');
  
  // Test with an email that likely exists in your database
  const testEmail = 'pforgot315@gmail.com'; // Change this to an email that exists in your database
  
  try {
    const response = await fetch('http://localhost:5001/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        platform: 'tth'
      })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Forgot password request successful!');
      console.log('Check your backend console for email logs.');
    } else {
      console.log('❌ Forgot password request failed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing forgot password API:', error.message);
  }
}

testForgotPasswordAPI(); 