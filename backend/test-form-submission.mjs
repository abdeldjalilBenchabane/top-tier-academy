import fetch from 'node-fetch';

async function testFormSubmission() {
  try {
    console.log('🧪 Testing form submission...');
    
    const payload = {
      title: 'Test Session from Form',
      description: 'Test description from form',
      start_time: new Date().toISOString(),
      duration: 60,
      price: 100,
      material_id: 1,
      professorId: 3
    };

    console.log('📤 Sending payload:', payload);

    const response = await fetch('http://localhost:8080/api/professors/3/live-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to replace this with a real token
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response status:', response.status);
    const result = await response.text();
    console.log('📥 Response body:', result);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFormSubmission(); 