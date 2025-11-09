// Quick test to verify Firestore connection
require('dotenv').config();
const { db } = require('./src/firebase');

async function testFirestore() {
  try {
    console.log('Testing Firestore connection...');

    // Try to write a test document
    const testRef = db.collection('_test').doc('connection');
    await testRef.set({
      message: 'Firestore is working!',
      timestamp: new Date().toISOString()
    });

    console.log('✅ Successfully wrote to Firestore!');

    // Try to read it back
    const doc = await testRef.get();
    console.log('✅ Successfully read from Firestore!');
    console.log('Data:', doc.data());

    // Clean up test document
    await testRef.delete();
    console.log('✅ Test complete! Firestore is ready.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Firestore test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testFirestore();
