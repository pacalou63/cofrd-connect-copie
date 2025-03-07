// Fichier api/index.js pour Vercel
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('../routes/userRoutes');
const messageRoutes = require('./messages');
const { initSocket } = require('./socket');
require('dotenv').config();

const app = express();

// Configuration CORS simplifiée avec domaine stable
const corsOptions = {
    origin: ["https://cofrd-connect-frontend.vercel.app", "http://localhost:3000"],
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
    
    if (origin === "https://cofrd-connect-frontend.vercel.app" || origin === "http://localhost:3000") {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    next();
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

// Route d'inscription
app.post('/api/users', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log('Tentative d\'inscription avec:', { username, email, password });

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Nom d\'utilisateur, email et mot de passe requis'
            });
        }

        // Importer le modèle User
        const User = require('../models/User');

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ 
            $or: [
                { email: email },
                { username: username }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ? 'Email déjà utilisé' : 'Nom d\'utilisateur déjà utilisé'
            });
        }

        // Créer un nouvel utilisateur
        const user = new User({ username, email, password });

        // Enregistrer l'utilisateur
        await user.save();

        // Créer un objet utilisateur sans le mot de passe
        const userObject = {
            id: user._id,
            username: user.username,
            email: user.email,
            admin: user.admin
        };

        res.status(201).json({
            message: 'Inscription réussie',
            user: userObject
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'inscription',
            error: error.message
        });
    }
});

// Route de connexion (utilise email au lieu de username)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Tentative de connexion avec:', { email, password });

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email et mot de passe requis'
            });
        }

        // Importer le modèle User
        const User = require('../models/User');

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
