const { Server } = require('socket.io');
const Message = require('./models/message');

// Fonction pour initialiser Socket.IO
function initializeSocketIO(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        },
        allowEIO3: true,
        pingTimeout: 60000,
        transports: ['polling', 'websocket'] // Commencer par polling pour Vercel
    });

    // Gestion des connexions socket
    io.on('connection', (socket) => {
        console.log('Un utilisateur s\'est connecté, ID socket:', socket.id);
        let userId = null;

        // Récupérer l'ID utilisateur de la requête
        if (socket.handshake.query && socket.handshake.query.userId) {
            userId = socket.handshake.query.userId;
            console.log(`Utilisateur ${userId} connecté via socket ${socket.id}`);
            socket.join(userId);
        }

        socket.on('login', (id) => {
            console.log(`Événement login reçu pour l'utilisateur ${id} sur socket ${socket.id}`);
            userId = id;
            socket.join(id);
        });

        socket.on('disconnect', (reason) => {
            console.log(`Socket ${socket.id} déconnecté, raison: ${reason}`);
            if (userId) {
                console.log(`Utilisateur ${userId} déconnecté`);
            }
        });

        socket.on('error', (error) => {
            console.error(`Erreur sur socket ${socket.id}:`, error);
        });

        socket.on('private message', async ({ to, from, message, id }) => {
            try {
                console.log(`Message privé reçu de ${from} pour ${to} avec ID ${id}`);
                
                // Sauvegarder le message
                const newMessage = new Message({
                    from,
                    to,
                    text: message,
                    timestamp: new Date()
                });
                
                await newMessage.save();
                
                console.log('Message privé sauvegardé avec succès:', newMessage);
                
                // Envoyer le message à la personne concernée
                io.to(to).emit('private message', {
                    from,
                    message,
                    timestamp: newMessage.timestamp,
                    id: newMessage._id.toString() // Utiliser l'ID MongoDB comme ID de message
                });
            } catch (error) {
                console.error('Erreur lors de l\'envoi du message privé:', error);
                // Envoyer une notification d'erreur au client
                socket.emit('message_error', {
                    error: 'Erreur lors de l\'envoi du message',
                    details: error.message
                });
            }
        });
    });

    return io;
}

module.exports = { initializeSocketIO };
