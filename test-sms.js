require('dotenv').config();
const { sendSMS } = require('./src/services/notificationService');

async function testSMS() {
    const phoneNumber = '+918220777183'; // Added country code for India, common for this format
    const message = 'Hello! This is a test SMS from your KIRA Safety App integration.';

    console.log(`🚀 Sending test SMS to ${phoneNumber}...`);

    try {
        const result = await sendSMS(phoneNumber, message);
        if (result.success) {
            console.log('✅ Test SMS sent successfully!');
            console.log('Result:', result);
        } else {
            console.log('❌ Failed to send test SMS.');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('💥 Unexpected error during test:', error);
    }
}

testSMS();
