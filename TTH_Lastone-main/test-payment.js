// Test the payments endpoint
const testPayment = async () => {
  try {
    // First, let's test if the server is running
    const healthResponse = await fetch('http://localhost:5001/api/health');
    if (healthResponse.ok) {
      console.log('✓ Server is running');
    } else {
      console.log('✗ Server is not responding');
      return;
    }

    // Test the payments endpoint
    const response = await fetch('http://localhost:5001/api/payments/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_token' // This will fail auth, but we can see if the endpoint exists
      },
      body: JSON.stringify({
        amount: 1000,
        currency: 'dzd',
        packageId: 1,
        packageName: 'Test Package'
      })
    });

    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('✓ Payments endpoint exists (auth required)');
    } else if (response.status === 404) {
      console.log('✗ Payments endpoint not found');
    } else {
      const data = await response.json();
      console.log('Response:', data);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

testPayment(); 