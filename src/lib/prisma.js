const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test the connection
prisma.$connect()
    .then(() => {
        console.log('✅ Successfully connected to the MySQL Database');
    })
    .catch((err) => {
        console.error('❌ Failed to connect to the MySQL Database:', err);
    });

module.exports = prisma;
