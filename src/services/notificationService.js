const admin = require('../config/firebaseAdmin');
const prisma = require('../lib/prisma');
const twilio = require('twilio');

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);


/**
 * Helper to ensure phone number is in E.164 format.
 * Defaults to India (+91) if it's a 10-digit number.
 */
function formatPhoneNumber(phone) {
    if (!phone) return null;
    let cleaned = phone.trim().replace(/\s+/g, ''); // Remove spaces

    // If it starts with +, it's already in E.164
    if (cleaned.startsWith('+')) return cleaned;

    // If it's a 10-digit number, assume it's an Indian number (+91)
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }

    return cleaned;
}

/**
 * Send SMS using Twilio
 * @param {string} to - Destination phone number
 * @param {string} body - SMS message content
 */
async function sendSMS(to, body) {
    const formattedTo = formatPhoneNumber(to);
    try {
        const message = await twilioClient.messages.create({
            body: body,
            from: process.env.TWILIO_PHONE,
            to: formattedTo
        });
        console.log(`✅ [SMS SUCCESS] Message sent to ${formattedTo}`);
        console.log(`   SID: ${message.sid}`);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error(`❌ [SMS ERROR] Failed to send SMS to ${formattedTo || to}`);
        console.error(`   Reason: ${error.message}`);
        return { success: false, error: error.message };
    }
}

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

        // Send SMS to each contact
        const smsPromises = user.contacts.map(contact => {
            if (contact.phone) {
                const messageBody = `${notification.title}\n\n${notification.body}`;
                return sendSMS(contact.phone, messageBody);
            }
            return Promise.resolve({ success: false, reason: 'No phone number' });
        });

        const results = await Promise.all(smsPromises);
        const successCount = results.filter(r => r.success).length;

        console.log(`📊 [SMS SUMMARY] Sent ${successCount}/${user.contacts.length} emergency SMS alerts`);

        return {
            success: successCount > 0,
            contactsNotified: user.contacts.length,
            smsResults: results
        };

    } catch (error) {
        console.error('❌ [ERROR] Failed to send notifications to emergency contacts:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send urgent notification to user when their contacts are alerted
 * @param {string} userId - User ID
 */
async function sendLateCheckInUrgentNotification(userId) {
    return await sendNotificationToUser(userId, {
        title: '🚨 CRITICAL: Contacts Notified',
        body: 'You missed your check-in! We have alerted your emergency contacts. Please check in now to let them know you are safe.',
        data: {
            type: 'urgent_alert',
            action: 'open_checkin'
        }
    });
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

/**
 * Send Safe Day confirmation to emergency contacts
 * @param {string} userId - User ID
 */
async function sendSafeDayNotification(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
    });

    return await sendNotificationToEmergencyContacts(userId, {
        title: '✅ KIRA Safe Today',
        body: `${user?.name || 'A user'} has checked in and is SAFE today.`,
        data: {
            type: 'safe_checkin',
            userId: userId
        }
    });
}

module.exports = {
    sendSMS,
    sendNotificationToUser,
    sendNotificationToMultipleUsers,
    sendNotificationToEmergencyContacts,
    sendCheckInReminder,
    sendLateCheckInUrgentNotification,
    sendMissedCheckInAlert,
    sendSOSAlert,
    sendTimerExpiryAlert,
    sendSafeDayNotification
};


