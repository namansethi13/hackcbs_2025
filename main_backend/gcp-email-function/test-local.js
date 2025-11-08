const axios = require('axios');

// Test the Cloud Function locally
const testLocalFunction = async () => {
  const url = 'http://localhost:8080'; // Local Functions Framework port

  const testData = {
    to: 'test@example.com',
    templateType: 'invitation',
    templateData: {
      organizationName: 'Test Organization',
      inviterName: 'John Doe',
      acceptUrl: 'http://localhost:5173/invite/accept/test-token',
      rejectUrl: 'http://localhost:5173/invite/reject/test-token',
      expiryDays: 7
    }
  };

  try {
    console.log('Testing email function...');
    console.log('Request data:', JSON.stringify(testData, null, 2));

    const response = await axios.post(url, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\nSuccess!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('\nError!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testLocalFunction();
