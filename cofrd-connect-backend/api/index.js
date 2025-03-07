// Fichier api/index.js pour Vercel
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('../routes/userRoutes');
const messageRoutes = require('./messages');
const { initSocket } = require('./socket');
require('dotenv').config();

// Importer les modèles au début du fichier
const User = require('../models/user');  // Correction de la casse
const Message = require('../models/message');

const app = express();

// Configuration CORS plus permissive pour permettre les tests avec Postman
const corsOptions = {
    origin: function(origin, callback) {
        // Autoriser les requêtes sans origine (comme Postman)
        if (!origin) {
            return callback(null, true);
        }
        
        // Autoriser les origines spécifiques
        if (origin === "https://cofrd-connect-frontend.vercel.app" || 
            origin === "http://localhost:3000" ||
            origin.includes('postman') ||
            origin.endsWith('vercel.app')) {
            return callback(null, true);
        }
        
        console.log('Origine bloquée par CORS:', origin);
        return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Middleware CORS simplifié
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Si pas d'origine (comme Postman) ou origine autorisée
    if (!origin || 
        origin === "https://cofrd-connect-frontend.vercel.app" || 
        origin === "http://localhost:3000" ||
        origin.includes('postman') ||
        origin.endsWith('vercel.app')) {
        
        // Pour les requêtes sans origine, utiliser * ou une origine spécifique
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    next();
});

// Gestion explicite des requêtes OPTIONS pour toutes les routes
app.options('*', (req, res) => {
    console.log('Requête OPTIONS reçue pour:', req.path);
    res.status(204).end();
});

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

// Route de connexion (utilise email au lieu de username)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Tentative de connexion avec:', { email, password: '***' });

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email et mot de passe requis'
            });
        }

        // Trouver l'utilisateur
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier le mot de passe avec la méthode du modèle
        if (!(await user.comparePassword(password))) {
            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Créer un objet utilisateur sans le mot de passe
        const userObject = {
            id: user._id,
            username: user.username,
            email: user.email,
            admin: user.admin
        };

        res.json({
            message: 'Connexion réussie',
            user: userObject
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            message: 'Erreur lors de la connexion',
            error: error.message
        });
    }
});

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
