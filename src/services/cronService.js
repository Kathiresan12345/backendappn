const cron = require('node-cron');
const prisma = require('../lib/prisma');

console.log('⏰ Cron Services Initialized');

// Safe Timer Expiry Check (Every minute)
cron.schedule('* * * * *', async () => {
    console.log('Running Safe Timer Expiry Check...');
    const now = new Date();
    const expiredTimers = await prisma.safeTimer.findMany({
        where: {
            status: 'active',
            endTime: { lt: now }
        }
    });

    for (const timer of expiredTimers) {
        // Mark as expired
        await prisma.safeTimer.update({
            where: { id: timer.id },
            data: { status: 'expired' }
        });

        // Trigger SOS workflow
        await prisma.sOS.create({
            data: {
                userId: timer.userId,
                lat: timer.destinationLat || 0,
                lng: timer.destinationLng || 0,
                type: 'active',
                status: 'active',
                reason: 'Safe Timer expired'
            }
        });

        // TODO: Notify contacts
        console.log(`Auto-SOS triggered for user ${timer.userId} due to timer expiry`);
    }
});

// Critical Inactivity Monitor (The 32-Hour Rule) - Every 15 minutes
cron.schedule('*/15 * * * *', async () => {
    console.log('Running Critical Inactivity Monitor...');
    const thirtyTwoHoursAgo = new Date(Date.now() - 32 * 60 * 60 * 1000);

    const inactiveUsers = await prisma.user.findMany({
        where: {
            checkIns: {
                none: {
                    createdAt: { gt: thirtyTwoHoursAgo }
                }
            },
            is_mobile_verified: true
        }
    });

    for (const user of inactiveUsers) {
        // Trigger internal SOS
        console.log(`Alert: User ${user.id} (${user.name}) hasn't checked in for 32 hours!`);
        // TODO: Send SMS to all trusted contacts
    }
});

// Daily Check-in Reminder (Simplified example - ideally use user-specific times)
cron.schedule('0 18 * * *', async () => {
    console.log('Sending daily check-in reminders...');
    // Logic to find users who haven't checked in today and send push notifications
});
