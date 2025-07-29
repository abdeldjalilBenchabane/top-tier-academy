import fetch from 'node-fetch';

async function testPathAPI() {
  try {
    console.log('Testing course path API endpoint...');
    
    // Test the new path endpoint
    const response = await fetch('http://localhost:8081/api/courses/19/path', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token', // You might need a real token
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Path API response:', data);
      console.log('Complete path:', data.path);
    } else {
      console.log('API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPathAPI(); 