const cron = require('node-cron');
const prisma = require('../lib/prisma');

console.log('⏰ Cron Services Initialized');

/**
 * Job: SafetyTimerExpiry
 * Frequency: Every 1 Minute
 * Description: Checks all active timers. If endTime passed and not stopped, AUTO-TRIGGER SOS.
 */
cron.schedule('* * * * *', async () => {
    console.log('Running SafetyTimerExpiry...');
    const now = new Date();
    const expiredTimers = await prisma.safeTimer.findMany({
        where: {
            status: 'active',
            endTime: { lt: now }
        }
    });

    for (const timer of expiredTimers) {
        await prisma.safeTimer.update({
            where: { id: timer.id },
            data: { status: 'sos_triggered' }
        });

        await prisma.sOS.create({
            data: {
                userId: timer.userId,
                lat: timer.destinationLat || 0,
                lng: timer.destinationLng || 0,
                type: 'active',
                status: 'active',
                reason: 'Safety Timer expired'
            }
        });

        console.log(`🚨 Auto-SOS triggered for user ${timer.userId} due to timer expiry`);
        // TODO: Call notification service to send SMS/Push to contacts
    }
});

/**
 * Job: DailyCheckinReminder
 * Frequency: Hourly (Checks if any user needs a reminder at this hour)
 */
cron.schedule('0 * * * *', async () => {
    console.log('Running DailyCheckinReminder...');
    const now = new Date();
    const currentHour = `${now.getHours().toString().padStart(2, '0')}:00`;

    const usersToRemind = await prisma.user.findMany({
        where: {
            settings: {
                reminderTime: currentHour,
                notificationsEnabled: true
            }
        },
        include: { settings: true }
    });

    for (const user of usersToRemind) {
        console.log(`🔔 Sending reminder to user ${user.id}`);
        // TODO: Send FCM Push Notification
    }
});

/**
 * Job: MissedAlertEscalation
 * Frequency: Every 5 Minutes
 * Description: If a user misses check-ins, notify primary contact.
 */
cron.schedule('*/5 * * * *', async () => {
    console.log('Running MissedAlertEscalation...');
    // Real logic would track consecutive misses. 
    // Simplified: Check users who haven't checked in for 24+ hours.
    const alertThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const usersWithMissedAlerts = await prisma.user.findMany({
        where: {
            checkIns: {
                none: {
                    createdAt: { gt: alertThreshold }
                }
            }
        },
        include: { contacts: { where: { isEmergencyContact: true } } }
    });

    for (const user of usersWithMissedAlerts) {
        if (user.contacts.length > 0) {
            console.log(`⚠️ Escalating missed check-in alert for user ${user.id} to ${user.contacts[0].phone}`);
            // TODO: Send SMS Alert to primary contact
        }
    }
});

/**
 * Job: HistoryClean
 * Frequency: Monthly
 * Description: Archive data older than 12 months.
 */
cron.schedule('0 0 1 * *', async () => {
    console.log('Running HistoryClean...');
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const oldCheckins = await prisma.checkIn.deleteMany({
        where: { createdAt: { lt: twelveMonthsAgo } }
    });

    console.log(`🧹 Cleaned up ${oldCheckins.count} old check-ins`);
});
