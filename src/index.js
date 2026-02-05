const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

// Load env vars
dotenv.config();

// Import services & routes
require('./lib/prisma'); // DB connection check
const initSocket = require('./services/socketService');
require('./services/cronService');

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const userRoutes = require('./routes/userRoutes');
const timerRoutes = require('./routes/timerRoutes');
const sosRoutes = require('./routes/sosRoutes');
const achievementRoutes = require('./routes/achievementRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io via Service
initSocket(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/user', userRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/achievements', achievementRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'KIRA Safety API is running' });
});

server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
