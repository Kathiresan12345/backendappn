const admin = require('./src/config/firebaseAdmin');

const fcmToken = 'fo1SQRaCRCutqn6Fgpul1h:APA91bFEgmMcu6_Zmu88BTARl61vtiGRl8zOcVSOb3hBR5G5vVxm1EKP-ZoB6qm1wT_I4CRikXKl9XOknsRIjnFj3gEW4PegC3OK7K2gt-O51vkj9Fq7-Wg';

async function testNotification() {
    const message = {
        notification: {
            title: 'KIRA Safety System',
            body: 'This is a test notification from the KIRA backend!'
        },
        data: {
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            status: 'done'
        },
        token: fcmToken
    };

    try {
        console.log('🚀 Sending test notification...');
        const response = await admin.messaging().send(message);
        console.log('✅ [SUCCESS] Notification sent successfully');
        console.log(`   Message ID: ${response}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ [ERROR] Failed to send notification');
        console.error(`   Reason: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        process.exit(1);
    }
}

testNotification();
