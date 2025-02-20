const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Charger les données mock
const mockDataPath = path.join(__dirname, '../cofrd-connect-frontend/src/mockData.json');
const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

// Structure pour stocker les messages
let messages = [];

// Charger les messages existants s'ils existent
try {
    const messagesData = fs.readFileSync(path.join(__dirname, 'messages.json'), 'utf8');
    messages = JSON.parse(messagesData);
} catch (error) {
    console.log('Aucun message existant trouvé');
}

// Sauvegarder les messages dans le fichier
const saveMessages = () => {
    fs.writeFileSync(path.join(__dirname, 'messages.json'), JSON.stringify(messages), 'utf8');
};

// Routes API pour les messages
app.get('/api/messages', (req, res) => {
    res.json(messages);
});

app.get('/api/messages/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userMessages = messages.filter(msg => 
        msg.from === userId || msg.to === userId
    );
    res.json(userMessages);
});

// Route pour récupérer tous les utilisateurs
app.get('/api/users', (req, res) => {
    res.json(mockData.users);
});

// Route pour récupérer un utilisateur spécifique
app.get('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const user = mockData.users.find(u => u.id === id);
    if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
});

// Route pour récupérer toutes les activités
app.get('/api/activites', (req, res) => {
    res.json(mockData.activites);
});

// Route pour récupérer une activité
app.get('/api/activites/id', (req, res) => {
    res.json(mockData.activites);
});

// Route pour créer une activité
app.post('/api/activites', (req, res) => {
    const newActivite = req.body;
    newActivite.idActivite = mockData.activites.length + 1;
    mockData.activites.push(newActivite);
    res.json(newActivite);
});

app.put('/api/activites/:id', (req, res) => {
    console.log('PUT request received');
    console.log('ID:', req.params.id);
    console.log('Body:', req.body);
    
    const id = parseInt(req.params.id);
    const updatedActivite = req.body;
    
    const index = mockData.activites.findIndex(a => a.idActivite === id);
    if (index === -1) {
        return res.status(404).json({ message: 'Activité non trouvée' });
    }
    
    mockData.activites[index] = { 
        ...mockData.activites[index], 
        ...updatedActivite,
        idActivite: id  
    };
    
    // Optionnel : sauvegarder les modifications dans le fichier
    fs.writeFileSync(mockDataPath, JSON.stringify(mockData, null, 2));
    
    res.json(mockData.activites[index]);
});

// Stocker les connexions des utilisateurs
const userSockets = new Map();

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');

    socket.on('login', (userId) => {
        console.log('User logged in:', userId);
        userSockets.set(userId, socket.id);
        console.log('Connected users:', Array.from(userSockets.entries()));
    });

    socket.on('private message', ({ from, to, message }) => {
        console.log('Message received:', { from, to, message });
        const receiverSocket = userSockets.get(to);
        
        // Sauvegarder le message
        const newMessage = {
            id: Date.now(),
            from,
            to,
            text: message,
            timestamp: new Date().toISOString()
        };
        messages.push(newMessage);
        saveMessages();

        // Envoyer au destinataire
        if (receiverSocket) {
            socket.to(receiverSocket).emit('private message', {
                from,
                message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                console.log('User removed:', userId);
                break;
            }
        }
        console.log('Remaining users:', Array.from(userSockets.entries()));
    });
});

// Modifier la dernière ligne pour utiliser 'server' au lieu de 'app'
server.listen(3001, () => {
    console.log('Serveur démarré sur le port 3001');
});