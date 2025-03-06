const socketIO = require('socket.io');
const Message = require('../models/Message');
const User = require('../models/User');

// Map pour stocker les connexions socket des utilisateurs
const userSockets = new Map();

// Fonction pour initialiser Socket.IO
const initSocket = (server) => {
    console.log('Initialisation de Socket.IO');
    
    const io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        },
        transports: ['polling', 'websocket'] // Commencer par polling pour Vercel
    });

    // Stocker l'instance io globalement pour y accéder depuis d'autres modules
    global.io = io;

    // Middleware pour enregistrer les connexions
    io.use((socket, next) => {
        const userId = socket.handshake.query.userId;
        if (!userId) {
            return next(new Error('Authentification requise'));
        }
        console.log(`Socket middleware: utilisateur ${userId} connecté`);
        socket.userId = userId;
        next();
    });

    // Gestionnaire de connexion
    io.on('connection', (socket) => {
        console.log(`Nouvelle connexion socket: ${socket.id}`);
        
        // Événement de login
        socket.on('login', (userId) => {
            console.log(`Utilisateur ${userId} connecté via socket ${socket.id}`);
            
            // Stocker la connexion socket de l'utilisateur
            userSockets.set(userId, socket.id);
            socket.userId = userId;
            
            // Rejoindre une salle privée
            socket.join(`user:${userId}`);
        });

        // Événement de message privé
        socket.on('private message', async (data) => {
            try {
                const { from, to, message, id } = data;
                console.log('Message privé reçu:', data);
                
                // Valider les données
                if (!from || !to || !message) {
                    console.error('Données de message incomplètes');
                    return;
                }
                
                // Sauvegarder le message dans la base de données
                const newMessage = new Message({
                    _id: id || undefined, // Utiliser l'ID fourni ou laisser MongoDB en générer un
                    from,
                    to,
                    text: message,
                    timestamp: new Date()
                });
                
                const savedMessage = await newMessage.save();
                console.log('Message sauvegardé dans la BDD:', savedMessage);
                
                // Envoyer le message au destinataire s'il est connecté
                const recipientSocketId = userSockets.get(to);
                if (recipientSocketId) {
                    console.log(`Envoi du message à l'utilisateur ${to} (socket ${recipientSocketId})`);
                    io.to(recipientSocketId).emit('private message', {
                        id: savedMessage._id.toString(),
                        from,
                        message,
                        timestamp: savedMessage.timestamp
                    });
                } else {
                    console.log(`L'utilisateur ${to} n'est pas connecté, message stocké pour récupération ultérieure`);
                }
            } catch (error) {
                console.error('Erreur lors du traitement du message privé:', error);
            }
        });

        // Événement de déconnexion
        socket.on('disconnect', () => {
            console.log(`Socket ${socket.id} déconnecté`);
            
            if (socket.userId) {
                console.log(`Utilisateur ${socket.userId} déconnecté`);
                userSockets.delete(socket.userId);
            }
        });
    });

    return io;
};

// Fonction pour envoyer un message à un utilisateur spécifique (utilisée par l'API REST)
const sendMessageToUser = async (from, to, message, messageId) => {
    try {
        console.log(`Tentative d'envoi de message à l'utilisateur ${to} via Socket.IO`);
        
        // Vérifier si l'utilisateur est connecté
        const recipientSocketId = userSockets.get(to);
        if (recipientSocketId) {
            console.log(`Utilisateur ${to} connecté, envoi du message via socket ${recipientSocketId}`);
            const io = global.io; // Accéder à l'instance io globale
            
            if (io) {
                io.to(recipientSocketId).emit('private message', {
                    id: messageId,
                    from,
                    message,
                    timestamp: new Date()
                });
                return true;
            } else {
                console.error('Instance Socket.IO non disponible');
                return false;
            }
        } else {
            console.log(`L'utilisateur ${to} n'est pas connecté, message stocké pour récupération ultérieure`);
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message via Socket.IO:', error);
        return false;
    }
};

// Gestionnaire pour les requêtes Socket.IO sur Vercel
const vercelHandler = (req, res) => {
    if (process.env.VERCEL) {
        // Vérifier si c'est une requête de mise à niveau pour WebSocket
        if (req.method === 'GET' && req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
            res.status(426).json({ error: 'Upgrade Required' });
            return;
        }
        
        // Pour les requêtes POST (polling)
        if (req.method === 'POST') {
            try {
                const { from, to, message } = req.body;
                
                if (!from || !to || !message) {
                    res.status(400).json({ error: 'Données incomplètes' });
                    return;
                }
                
                // Créer et sauvegarder le message
                const newMessage = new Message({
                    from,
                    to,
                    text: message,
                    timestamp: new Date()
                });
                
                newMessage.save()
                    .then(savedMessage => {
                        // Essayer d'envoyer le message via Socket.IO si possible
                        sendMessageToUser(from, to, message, savedMessage._id.toString());
                        
                        res.status(201).json({
                            id: savedMessage._id,
                            from,
                            to,
                            message,
                            timestamp: savedMessage.timestamp
                        });
                    })
                    .catch(error => {
                        console.error('Erreur lors de la sauvegarde du message:', error);
                        res.status(500).json({ error: 'Erreur serveur' });
                    });
            } catch (error) {
                console.error('Erreur lors du traitement de la requête:', error);
                res.status(500).json({ error: 'Erreur serveur' });
            }
            return;
        }
        
        // Pour les autres méthodes HTTP
        res.status(405).json({ error: 'Méthode non autorisée' });
    } else {
        res.status(404).json({ error: 'Not Found' });
    }
};

module.exports = {
    initSocket,
    sendMessageToUser,
    vercelHandler
};
