// Test script to verify API endpoints
require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

// You'll need to replace this with a valid token from your login
const TEST_TOKEN = 'your-token-here';

async function testEndpoints() {
  console.log('Testing API endpoints...\n');

  try {
    // Test 1: Get all users
    console.log('1. Testing GET /api/users/all');
    const usersResponse = await axios.get(`${API_URL}/users/all`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    console.log('✓ Users:', usersResponse.data);
    console.log('');

    // Test 2: Get organizations
    console.log('2. Testing GET /api/orgs');
    const orgsResponse = await axios.get(`${API_URL}/orgs`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    console.log('✓ Organizations:', orgsResponse.data);

    if (orgsResponse.data.organizations.length > 0) {
      const orgId = orgsResponse.data.organizations[0].id;
      console.log('');

      // Test 3: Get organization details
      console.log(`3. Testing GET /api/orgs/${orgId}`);
      const orgDetailsResponse = await axios.get(`${API_URL}/orgs/${orgId}`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      console.log('✓ Organization Details:', orgDetailsResponse.data);
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

console.log('NOTE: Replace TEST_TOKEN with a real token from your login!\n');
console.log('To get a token:');
console.log('1. Login at http://localhost:5173/login');
console.log('2. Open DevTools > Application > Local Storage');
console.log('3. Copy the "token" value\n');

// Uncomment this when you have a token
// testEndpoints();

console.log('Run this after you set the TEST_TOKEN variable.');
