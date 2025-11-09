// Quick test of the /api/users/all endpoint
const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

// Get this token from your browser's localStorage after logging in
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Replace with your actual token

async function testGetAllUsers() {
  try {
    console.log('Testing GET /api/users/all...');
    console.log('URL:', `${API_URL}/users/all`);
    console.log('');

    const response = await axios.get(`${API_URL}/users/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('Number of users:', response.data.users?.length || 0);
  } catch (error) {
    console.error('❌ Error!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    console.error('URL:', error.config?.url);
  }
}

console.log('INSTRUCTIONS:');
console.log('1. Login at http://localhost:5173/login');
console.log('2. Open DevTools (F12) > Application > Local Storage');
console.log('3. Copy the "token" value');
console.log('4. Replace the token variable in this file');
console.log('5. Run: node test-get-users.js');
console.log('');

if (token.length > 50) {
  testGetAllUsers();
} else {
  console.log('⚠️  Please set a valid token first!');
}
