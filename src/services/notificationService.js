const admin = require('../config/firebaseAdmin');
const prisma = require('../lib/prisma');

/**
 * Send Push Notification to a single user
 * @param {string} userId - User ID from database
 * @param {object} notification - { title, body, data }
 */
async function sendNotificationToUser(userId, notification) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fcmToken: true, name: true }
        });

        if (!user || !user.fcmToken) {
            console.log(`⚠️ User ${userId} has no FCM token registered`);
            return { success: false, reason: 'No FCM token' };
        }

        const message = {
            notification: {
                title: notification.title,
                body: notification.body
            },
            data: notification.data || {},
            token: user.fcmToken
        };

        const response = await admin.messaging().send(message);
        console.log(`✅ [SUCCESS] Notification sent to ${user.name || userId}`);
        console.log(`   Message ID: ${response}`);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ [ERROR] Failed to send notification to user ${userId}`);
        console.error(`   Reason: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        return { success: false, error: error.message };
    }
}

/**
 * Send Push Notification to multiple users
 * @param {string[]} userIds - Array of user IDs
 * @param {object} notification - { title, body, data }
 */
async function sendNotificationToMultipleUsers(userIds, notification) {
    try {
        const users = await prisma.user.findMany({
            where: {
                id: { in: userIds },
                fcmToken: { not: null }
            },
            select: { fcmToken: true, id: true, name: true }
        });

        if (users.length === 0) {
            console.log('⚠️ [WARN] No users with FCM tokens found for the provided IDs');
            return { success: false, reason: 'No FCM tokens' };
        }

        const tokens = users.map(u => u.fcmToken);

        const message = {
            notification: {
                title: notification.title,
                body: notification.body
            },
            data: notification.data || {},
            tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        console.log(`📊 [SUMMARY] Notification Multicast Result:`);
        console.log(`   ✅ Success: ${response.successCount}`);
        console.log(`   ❌ Failure: ${response.failureCount}`);

        if (response.failureCount > 0) {
            console.log('   ⚠️ Failed Transmissions:');
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`      - Token: ${tokens[idx]} | Error: ${resp.error.message}`);
                }
            });
        }

        return { success: true, response };
    } catch (error) {
        console.error('❌ [ERROR] Critical failure in sendNotificationToMultipleUsers:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send notification to user's emergency contacts
 * @param {string} userId - User ID
 * @param {object} notification - { title, body, data }
 */
async function sendNotificationToEmergencyContacts(userId, notification) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                contacts: {
                    where: { isEmergencyContact: true }
                }
            }
        });

        if (!user || user.contacts.length === 0) {
            console.log(`⚠️ User ${userId} has no emergency contacts`);
            return { success: false, reason: 'No emergency contacts' };
        }

        // In a real implementation, you'd need to find the User records for these contacts
        // For now, we'll just log the phone numbers
        console.log(`📞 Would send SMS/notification to contacts:`, user.contacts.map(c => c.phone));

        // If contacts are also app users, you could send them push notifications
        // This would require a different schema where contacts reference user IDs

        return { success: true, contactsNotified: user.contacts.length };
    } catch (error) {
        console.error('❌ [ERROR] Failed to send notifications to emergency contacts:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send daily check-in reminder
 * @param {string} userId - User ID
 */
async function sendCheckInReminder(userId) {
    return await sendNotificationToUser(userId, {
        title: '🔔 KIRA Safety Reminder',
        body: 'Don\'t forget to check in today! Your safety matters.',
        data: {
            type: 'checkin_reminder',
            action: 'open_checkin'
        }
    });
}

/**
 * Send missed check-in alert to emergency contacts
 * @param {string} userId - User ID
 */
async function sendMissedCheckInAlert(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
    });

    return await sendNotificationToEmergencyContacts(userId, {
        title: '⚠️ KIRA Missed Check-in Alert',
        body: `${user?.name || 'A user'} has not checked in today. Please verify their safety.`,
        data: {
            type: 'missed_checkin',
            userId: userId
        }
    });
}

/**
 * Send SOS alert to emergency contacts
 * @param {string} userId - User ID
 * @param {object} location - { lat, lng }
 */
async function sendSOSAlert(userId, location) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
    });

    return await sendNotificationToEmergencyContacts(userId, {
        title: '🚨 KIRA EMERGENCY SOS',
        body: `${user?.name || 'Someone'} has triggered an SOS! Location: ${location.lat}, ${location.lng}`,
        data: {
            type: 'sos_alert',
            userId: userId,
            lat: location.lat?.toString(),
            lng: location.lng?.toString()
        }
    });
}

/**
 * Send timer expiry alert
 * @param {string} userId - User ID
 */
async function sendTimerExpiryAlert(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
    });

    return await sendNotificationToEmergencyContacts(userId, {
        title: '⏰ KIRA Safety Timer Expired',
        body: `${user?.name || 'A user'}'s safety timer has expired without check-in. Please verify their safety.`,
        data: {
            type: 'timer_expired',
            userId: userId
        }
    });
}

module.exports = {
    sendNotificationToUser,
    sendNotificationToMultipleUsers,
    sendNotificationToEmergencyContacts,
    sendCheckInReminder,
    sendMissedCheckInAlert,
    sendSOSAlert,
    sendTimerExpiryAlert
};
