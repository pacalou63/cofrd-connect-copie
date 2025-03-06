// Fichier api/index.js pour Vercel
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('../routes/userRoutes');
const messageRoutes = require('./messages');
const { initSocket } = require('./socket');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connexion MongoDB établie');
    } catch (error) {
        console.error('Erreur de connexion MongoDB:', error);
        process.exit(1);
    }
};

connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Route par défaut
app.get('/api', (req, res) => {
    res.json({ message: 'API COFRD Connect' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

// Configuration pour Vercel
if (process.env.VERCEL) {
    console.log('Application exécutée sur Vercel');
    
    // Exporter l'application pour Vercel
    module.exports = app;
} else {
    // Démarrer le serveur en mode développement
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
    });
    
    // Initialiser Socket.IO
    initSocket(server);
}
