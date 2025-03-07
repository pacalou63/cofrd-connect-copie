require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/user'); 
const Message = require('./models/message');
const Activite = require('./models/activite');

// Créer l'application Express
const app = express();

// Déterminer si nous sommes dans un environnement serverless (Vercel)
const isVercel = process.env.VERCEL === '1';

// Configuration conditionnelle de Socket.IO
let io = null;
let server = null;

// Ne créer le serveur HTTP et initialiser Socket.IO que si nous ne sommes pas sur Vercel
if (!isVercel) {
    const http = require('http');
    const { initializeSocketIO } = require('./socket');
    server = http.createServer(app);
    io = initializeSocketIO(server);
}

// Connexion à MongoDB
connectDB();

// Configuration CORS améliorée
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
app.use(express.json());
app.use(cors(corsOptions));

// Middleware CORS supplémentaire pour plus de contrôle
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Toujours définir Access-Control-Allow-Credentials à true
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Si pas d'origine (comme Postman) ou origine autorisée
    if (!origin || 
        origin === "https://cofrd-connect-frontend.vercel.app" || 
        origin === "http://localhost:3000" ||
        origin.includes('postman') ||
        origin.endsWith('vercel.app')) {
        
        // Pour les requêtes sans origine, utiliser * ou une origine spécifique
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    next();
});

// Gérer les requêtes favicon.png pour éviter les erreurs 404/500
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

// Gestion explicite des requêtes OPTIONS pour toutes les routes
app.options('*', (req, res) => {
    console.log('Requête OPTIONS reçue pour:', req.path);
    // Définir explicitement les headers CORS pour les requêtes OPTIONS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.status(204).end();
});

// Route de test
app.get('/', (req, res) => {
    try {
        // Vérifier si mongoose est connecté avant d'accéder à la propriété connection
        const mongoStatus = mongoose.connection && mongoose.connection.readyState 
            ? 'Connected' 
            : 'Disconnected';
            
        res.json({ 
            message: 'Backend is running!',
            mongodbStatus: mongoStatus,
            env: {
                nodeEnv: process.env.NODE_ENV || 'Not set',
                mongodbUriExists: !!process.env.MONGODB_URI,
                mongodbUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'Not set'
            }
        });
    } catch (error) {
        console.error('Erreur dans la route racine:', error);
        res.status(500).json({ 
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'production' ? 'Erreur interne' : error.message
        });
    }
});

// Route pour obtenir tous les utilisateurs
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des utilisateurs'
        });
    }
});

// Route pour obtenir tous les utilisateurs avec plus de détails
app.get('/api/users/details', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des utilisateurs'
        });
    }
});

// Route d'inscription
app.post('/api/users', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log('Tentative d\'inscription:', { username, email, password: '******' });
        
        // Validation des données
        if (!username || !email || !password) {
            console.log('Validation échouée: champs manquants');
            return res.status(400).json({ 
                message: 'Tous les champs sont requis (username, email, password)' 
            });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            console.log('Utilisateur existant:', existingUser.username);
            return res.status(400).json({ 
                message: 'Un utilisateur avec cet email existe déjà' 
            });
        }

        // Créer le nouvel utilisateur
        const user = new User({
            username,
            email,
            password
        });

        // Sauvegarder l'utilisateur
        await user.save();

        console.log('Utilisateur créé avec succès:', {
            id: user.id,
            username: user.username,
            email: user.email
        });

        // Retourner l'utilisateur sans le mot de passe
        const userObject = { ...user._doc, password: undefined };

        res.status(201).json({
            message: 'Inscription réussie',
            user: userObject
        });
    } catch (error) {
        console.error('Erreur détaillée lors de la création de l\'utilisateur:', error);
        
        return res.status(500).json({
            message: 'Erreur serveur lors de la création de l\'utilisateur',
            details: error.message
        });
    }
});

// Route de connexion
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

        // Trouver l'utilisateur
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier le mot de passe
        if (!(await user.comparePassword(password))) {
            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Retourner l'utilisateur sans le mot de passe
        const userObject = { ...user._doc, password: undefined };

        res.json({
            message: 'Connexion réussie',
            user: userObject
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            message: 'Erreur lors de la connexion'
        });
    }
});

// Route pour les messages
app.get('/api/messages/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ message: 'ID utilisateur requis' });
        }

        console.log('Récupération des messages pour l\'utilisateur:', userId);

        const messages = await Message.find({ $or: [{ from: parseInt(userId) }, { to: parseInt(userId) }] });

        console.log('Messages trouvés:', messages.length);
        
        if (messages.length > 0) {
            console.log('Exemple de message:', messages[0]);
        }

        // Organiser les messages par conversation
        const conversations = messages.reduce((acc, msg) => {
            const conversationId = msg.from === parseInt(userId) ? msg.to : msg.from;
            if (!acc[conversationId]) {
                acc[conversationId] = {
                    from: msg.from,
                    to: msg.to,
                    messages: []
                };
            }
            acc[conversationId].messages.push({
                id: msg.id,
                from: msg.from,
                message: msg.text,
                timestamp: msg.timestamp
            });
            return acc;
        }, {});

        res.json(Object.values(conversations));
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des messages'
        });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { from, to, text } = req.body;
        console.log('Tentative de sauvegarde de message:', { from, to, text });
        
        if (!from || !to || !text) {
            return res.status(400).json({ message: 'Tous les champs sont requis (from, to, text)' });
        }

        const message = new Message({
            from,
            to,
            text,
            timestamp: new Date()
        });

        await message.save();

        console.log('Message sauvegardé avec succès:', message);
        res.status(201).json(message);
    } catch (error) {
        console.error('Erreur détaillée lors de la création du message:', error);
        res.status(500).json({
            message: 'Erreur lors de la création du message'
        });
    }
});

// Route pour les activités
app.get('/api/activites', async (req, res) => {
    try {
        const activites = await Activite.find();
        res.json(activites);
    } catch (error) {
        console.error('Erreur lors de la récupération des activités:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des activités'
        });
    }
});

app.post('/api/activites', async (req, res) => {
    try {
        console.log('Backend - Tentative de création d\'activité:', req.body);
        
        // Validation des données minimales requises
        if (!req.body.libelleActivite || !req.body.description || !req.body.lieu || !req.body.date) {
            console.log('Backend - Validation échouée: champs manquants', req.body);
            return res.status(400).json({
                message: 'Les champs libelleActivite, description, lieu et date sont requis'
            });
        }
        
        const newActivite = new Activite({
            libelleActivite: req.body.libelleActivite,
            description: req.body.description,
            lieu: req.body.lieu,
            date: req.body.date,
            idActivite: req.body.idActivite
        });
        
        await newActivite.save();
        
        console.log('Backend - Activité créée avec succès:', {
            id: newActivite.id,
            libelleActivite: newActivite.libelleActivite,
            fullObject: newActivite
        });
        
        // Assurons-nous de renvoyer l'objet dans le format attendu par le frontend
        const responseActivite = {
            idActivite: newActivite.idActivite || newActivite.id.toString(),
            libelleActivite: newActivite.libelleActivite,
            description: newActivite.description,
            lieu: newActivite.lieu,
            date: newActivite.date
        };
        
        console.log('Backend - Réponse envoyée au frontend:', responseActivite);
        
        res.status(201).json(responseActivite);
    } catch (error) {
        console.error('Backend - Erreur détaillée lors de la création de l\'activité:', error);
        
        res.status(500).json({
            message: 'Erreur lors de la création de l\'activité',
            error: error.message
        });
    }
});

app.put('/api/activites/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log('Backend - Tentative de mise à jour de l\'activité avec ID:', id);
        console.log('Backend - Données reçues pour la mise à jour:', req.body);
        
        // Rechercher d'abord l'activité par ID
        let activite = await Activite.findById(id);
        
        if (!activite) {
            console.log('Backend - Activité non trouvée avec ID:', id);
            return res.status(404).json({ message: 'Activité non trouvée' });
        }
        
        console.log('Backend - Activité trouvée avant mise à jour:', activite);
        
        // Mettre à jour uniquement les champs fournis
        if (req.body.libelleActivite) activite.libelleActivite = req.body.libelleActivite;
        if (req.body.description) activite.description = req.body.description;
        if (req.body.lieu) activite.lieu = req.body.lieu;
        if (req.body.date) activite.date = req.body.date;
        if (req.body.heure) activite.heure = req.body.heure;
        if (req.body.statut) activite.statut = req.body.statut;
        if (req.body.idActivite) activite.idActivite = req.body.idActivite;
        
        await activite.save();
        
        console.log('Backend - Activité mise à jour avec succès:', activite);
        res.json(activite);
    } catch (error) {
        console.error('Backend - Erreur lors de la mise à jour de l\'activité:', error);
        res.status(500).json({
            message: 'Erreur lors de la mise à jour de l\'activité',
            error: error.message
        });
    }
});

app.delete('/api/activites/:id', async (req, res) => {
    try {
        console.log('Backend - Tentative de suppression d\'activité avec ID:', req.params.id);
        
        const id = req.params.id;
        const activite = await Activite.findByIdAndDelete(id);
        
        if (!activite) {
            console.log('Backend - Activité non trouvée avec ID:', id);
            return res.status(404).json({ 
                message: 'Activité non trouvée' 
            });
        }
        
        console.log('Backend - Activité supprimée avec succès:', {
            id: activite.id,
            libelleActivite: activite.libelleActivite
        });
        
        res.json({ 
            success: true, 
            message: 'Activité supprimée avec succès',
            id: activite.id
        });
    } catch (error) {
        console.error('Backend - Erreur détaillée lors de la suppression de l\'activité:', error);
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'activité',
            error: error.message
        });
    }
});

// Route pour obtenir les statistiques de la base de données
app.get('/api/stats', async (req, res) => {
    try {
        const stats = {
            users: await User.countDocuments(),
            activites: await Activite.countDocuments(),
            messages: await Message.countDocuments()
        };
        res.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

// Route pour créer un utilisateur admin (protégée)
app.post('/api/admin/users', async (req, res) => {
    console.log('Tentative de création d\'un admin');
    console.log('Headers reçus:', req.headers);
    console.log('Body reçu:', req.body);
    
    try {
        const adminKey = req.headers['admin-key'];
        console.log('Clé admin reçue:', adminKey);
        console.log('Clé admin attendue:', process.env.ADMIN_KEY);
        
        // Vérifier la clé admin
        if (adminKey !== process.env.ADMIN_KEY) {
            console.log('Clé admin invalide');
            return res.status(401).json({ message: 'Non autorisé' });
        }

        const { username, email, password } = req.body;
        console.log('Données utilisateur:', { username, email });

        // Vérifications de base
        if (!username || !email || !password) {
            console.log('Données manquantes');
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        // Créer l'utilisateur admin
        const user = new User({
            username,
            email,
            password,
            admin: 1
        });

        await user.save();

        console.log('Admin créé avec succès');

        // Retourner l'utilisateur sans le mot de passe
        const userObject = { ...user._doc, password: undefined };

        res.status(201).json(userObject);
    } catch (error) {
        console.error('Erreur détaillée:', error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
    }
});

// Route pour supprimer un utilisateur
app.delete('/api/users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log('Backend - Tentative de suppression de l\'utilisateur avec ID:', id);
        
        const user = await User.findByIdAndDelete(id);
        
        if (!user) {
            console.log('Backend - Utilisateur non trouvé avec ID:', id);
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        console.log('Backend - Utilisateur supprimé avec succès:', user);
        res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error('Backend - Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({
            message: 'Erreur lors de la suppression de l\'utilisateur',
            error: error.message
        });
    }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    console.error('Erreur non capturée:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Promesse rejetée non gérée:', error);
});

// Si nous ne sommes pas sur Vercel, démarrer le serveur HTTP
if (!isVercel) {
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
    });
}

// Exporter l'application pour Vercel
module.exports = app;
