const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    const liveSafeNamespace = io.of('/live-safe');

    // Authentication middleware for WebSocket
    liveSafeNamespace.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error"));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    liveSafeNamespace.on('connection', (socket) => {
        console.log('🔌 A user connected to /live-safe:', socket.id, 'User:', socket.user.userId);

        // Join personal room for private notifications
        socket.join(`user:${socket.user.userId}`);

        // Outgoing: App -> Server

        socket.on('sos:init', (data) => {
            // data: { type, location }
            console.log(`🚨 SOS Initialized by ${socket.user.userId}`);
            // In a real app, you'd trigger SMS/Push here via a service
            socket.emit('sos:alert_received', { success: true, timestamp: new Date() });
        });

        socket.on('sos:location_update', (data) => {
            // data: { sosSessionId, lat, lng, battery, speed }
            console.log(`📍 Location update for SOS ${data.sosSessionId}`);

            // Broadcast to the SOS session room (viewers)
            liveSafeNamespace.to(`sos:${data.sosSessionId}`).emit('sos:location_received', data);
        });

        socket.on('timer:sync', (data) => {
            // Heartbeat during active timer
            // data: { timerId, remainingSeconds, location }
            console.log(`⏲️ Timer sync for ${socket.user.userId}: ${data.remainingSeconds}s left`);
        });

        // Room joining for viewing
        socket.on('view_sos', (sosSessionId) => {
            socket.join(`sos:${sosSessionId}`);
            console.log(`👀 User viewing SOS: ${sosSessionId}`);
            // Notify the victim that someone is watching
            liveSafeNamespace.to(`sos:${sosSessionId}`).emit('sos:contact_viewing', {
                viewerId: socket.user.userId,
                timestamp: new Date()
            });
        });

        socket.on('disconnect', () => {
            console.log('📡 User disconnected from /live-safe');
        });
    });

    return io;
};

module.exports = initSocket;
