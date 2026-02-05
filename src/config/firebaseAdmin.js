const admin = require('firebase-admin');

const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

let serviceAccount;

if (fs.existsSync(serviceAccountPath)) {
    try {
        serviceAccount = require(serviceAccountPath);
        console.log('Loaded Firebase credentials from serviceAccountKey.json');
    } catch (error) {
        console.error('Error loading serviceAccountKey.json:', error);
    }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('Loaded Firebase credentials from environment variable');
    } catch (error) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', error);
    }
}

if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
    }
} else {
    console.warn('Firebase Service Account not found. Firebase features might not work.');
}

module.exports = admin;
