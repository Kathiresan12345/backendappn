const { Server } = require('socket.io');

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('🔌 A user connected to WebSocket:', socket.id);

        // SOS Location Updates
        socket.on('sos:location_update', (data) => {
            // data: { sosSessionId, lat, lng, battery, speed }
            console.log(`📍 Location update for SOS ${data.sosSessionId}:`, data);

            // Broadcast to contacts/viewers in the matching room
            socket.to(`sos:${data.sosSessionId}`).emit('sos:location_received', data);
        });

        // Join specialized SOS room
        socket.on('join_sos', (sosSessionId) => {
            socket.join(`sos:${sosSessionId}`);
            console.log(`🏠 User joined SOS room: ${sosSessionId}`);
        });

        socket.on('disconnect', () => {
            console.log('📡 User disconnected from WebSocket');
        });
    });

    return io;
};

module.exports = initSocket;
