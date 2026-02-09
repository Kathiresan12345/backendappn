const cron = require('node-cron');
const prisma = require('../lib/prisma');
const {
    sendTimerExpiryAlert,
    sendCheckInReminder,
    sendMissedCheckInAlert,
    sendLateCheckInUrgentNotification
} = require('./notificationService');

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

        // Send notification to emergency contacts
        await sendTimerExpiryAlert(timer.userId);
    }
});

/**
 * Job: DailyCheckinReminder
 * Frequency: Every 15 Minutes (15-30 mins as requested)
 * Description: Checks for users who haven't checked in today AND current time is past (reminderTime + alertDelay).
 */
cron.schedule('*/15 * * * *', async () => {
    console.log('Running DailyCheckinReminder...');
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // In a real implementation:
    // 1. Fetch users with settings enabled
    // 2. Parse user.settings.reminderTime (e.g., "19:00")
    // 3. Add user.settings.alertDelayMinutes
    // 4. If current time > calculatedTime AND no check-in today => Trigger Alert

    // Simplified fetch for demo:
    const usersToRemind = await prisma.user.findMany({
        where: {
            settings: {
                notificationsEnabled: true
            }
        },
        include: { settings: true, checkIns: true } // Need to filter checkIns in app logic or advanced query
    });

    for (const user of usersToRemind) {
        if (!user.settings) continue;

        // Check if user checked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkedInToday = await prisma.checkIn.count({
            where: {
                userId: user.id,
                createdAt: { gte: today }
            }
        });

        if (checkedInToday === 0) {
            // Parse reminder time (e.g., "19:00")
            const [reminderHour, reminderMinute] = user.settings.reminderTime.split(':').map(Number);

            // Calculate alert time (reminderTime + alertDelay)
            const alertTime = new Date();
            alertTime.setHours(reminderHour, reminderMinute, 0, 0);
            alertTime.setMinutes(alertTime.getMinutes() + user.settings.alertDelayMinutes);

            // 1. Handle Alert Time (SMS to Contacts + Urgent Push to User)
            if (now >= alertTime) {
                // Send Urgent Push to User EVERY 15 mins (every cron run)
                console.log(`🚨 Sending urgent late-checkin push to user ${user.id}`);
                await sendLateCheckInUrgentNotification(user.id);

                // Send SMS to Emergency Contacts (Gaurded: Only once per day)
                const lastAlert = user.settings.lastMissedCheckInAlertAt;
                const alreadyNotifiedToday = lastAlert &&
                    new Date(lastAlert).toLocaleDateString() === now.toLocaleDateString();

                if (!alreadyNotifiedToday) {
                    console.log(`⚠️ Sending missed check-in SMS alert for user ${user.id}`);
                    await sendMissedCheckInAlert(user.id);

                    await prisma.userSettings.upsert({
                        where: { userId: user.id },
                        update: { lastMissedCheckInAlertAt: now },
                        create: { userId: user.id, lastMissedCheckInAlertAt: now }
                    });
                }
            }
            // 2. Handle Reminder Time (Regular Push to User)
            else {
                const reminderTimeToday = new Date();
                reminderTimeToday.setHours(reminderHour, reminderMinute, 0, 0);

                if (now >= reminderTimeToday) {
                    console.log(`🔔 Sending regular check-in reminder to user ${user.id}`);
                    await sendCheckInReminder(user.id);
                }
            }
        }
    }
});

/**
 * Job: MissedAlertEscalation
 * Frequency: Every 5 Minutes
 * Description: If a user misses check-ins, notify primary contact.
 */
cron.schedule('*/5 * * * *', async () => {
    console.log('Running MissedAlertEscalation...');
    const now = new Date();
    // Real logic would track consecutive misses. 
    // Simplified: Check users who haven't checked in for 24+ hours.
    const alertThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const usersWithMissedAlerts = await prisma.user.findMany({
        where: {
            checkIns: {
                none: {
                    createdAt: { gt: alertThreshold }
                }
            }
        },
        include: {
            contacts: { where: { isEmergencyContact: true } },
            settings: true
        }
    });

    for (const user of usersWithMissedAlerts) {
        if (user.contacts.length > 0) {
            const lastAlert = user.settings?.lastMissedCheckInAlertAt;
            const alreadyNotifiedRecently = lastAlert && (now - new Date(lastAlert)) < 24 * 60 * 60 * 1000;

            if (!alreadyNotifiedRecently) {
                console.log(`⚠️ Escalating missed check-in alert for user ${user.id}`);
                await sendMissedCheckInAlert(user.id);

                await prisma.userSettings.upsert({
                    where: { userId: user.id },
                    update: { lastMissedCheckInAlertAt: now },
                    create: { userId: user.id, lastMissedCheckInAlertAt: now }
                });
            } else {
                console.log(`ℹ️ Skip escalation for user ${user.id} - already notified recently`);
            }
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
