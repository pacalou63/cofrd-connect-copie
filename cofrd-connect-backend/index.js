require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/user');
const Message = require('./models/message');
const Activite = require('./models/activite');

const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: (origin, callback) => {
            // Autoriser les requêtes sans origine (comme les applications mobiles ou Postman)
            if (!origin) return callback(null, true);
            
            // Autoriser localhost et toutes les URL contenant 'cofrd-connect'
            if (origin.includes('localhost') || origin.includes('cofrd-connect')) {
                return callback(null, true);
            }
            
            callback(new Error('Non autorisé par CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Connexion à MongoDB
connectDB();

// Base de données en mémoire pour les tests (commenté)
// const inMemoryDB = {
//     users: [
//         { id: 1, username: 'admin', email: 'admin@example.com', admin: 1 },
//         { id: 2, username: 'user1', email: 'user1@example.com', admin: 0 }
//     ],
//     messages: [],
//     activites: []
// };

// Middleware
app.use(express.json());
app.use(cors({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origine (comme les applications mobiles ou Postman)
        if (!origin) return callback(null, true);
        
        // Autoriser localhost et toutes les URL contenant 'cofrd-connect'
        if (origin.includes('localhost') || origin.includes('cofrd-connect')) {
            return callback(null, true);
        }
        
        callback(new Error('Non autorisé par CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Route de test
app.get('/', (req, res) => {
    res.json({ 
        message: 'Backend is running!',
        mongodbStatus: mongoose.connection.readyState ? 'Connected' : 'Disconnected',
        env: {
            nodeEnv: process.env.NODE_ENV || 'Not set',
            mongodbUriExists: !!process.env.MONGODB_URI,
            mongodbUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'Not set'
        }
    });
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

// Gestion des connexions socket
io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');
    let userId = null;

    socket.on('login', (id) => {
        console.log('Utilisateur connecté:', id);
        userId = id;
        socket.join(id);
    });

    socket.on('private message', async ({ to, from, message, id }) => {
        console.log('Message privé reçu:', { to, from, message, id });
        
        try {
            // Vérifier si le message existe déjà (pour éviter les doublons)
            const existingMessage = await Message.findOne({ from, to, text: message });
            
            if (existingMessage) {
                console.log('Message similaire déjà existant, utilisation de celui-ci:', existingMessage);
                
                // Envoyer le message au destinataire avec l'ID existant
                io.to(to).emit('private message', {
                    from,
                    message,
                    id: existingMessage.id,
                    timestamp: existingMessage.timestamp
                });
                
                return;
            }
            
            // Sauvegarder le message dans la base de données
            const newMessage = new Message({
                from,
                to,
                text: message,
                timestamp: new Date()
            });
            await newMessage.save();

            console.log('Message sauvegardé avec succès:', newMessage);

            // Envoyer le message au destinataire avec l'ID
            io.to(to).emit('private message', {
                from,
                message,
                id: newMessage.id,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté:', userId);
        if (userId) {
            socket.leave(userId);
        }
    });
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    console.error('Erreur non capturée:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Promesse rejetée non gérée:', error);
});

// Démarrage du serveur
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
