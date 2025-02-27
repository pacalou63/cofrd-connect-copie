const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const path = require('path');
const http = require('http');
const server = http.createServer(app);

// Configuration CORS commune
const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    return origin === (process.env.FRONTEND_URL || 'https://cofrd-connect-frontend.vercel.app') ||
           origin.endsWith('.vercel.app');
};

const corsOptions = {
    origin: function(origin, callback) {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
};

const io = require('socket.io')(server, {
    cors: {
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

app.use(cors(corsOptions));

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour logger les requêtes
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
});

// Middleware pour gérer les erreurs JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Erreur de parsing JSON:', err);
        return res.status(400).json({ message: 'Invalid JSON' });
    }
    next();
});

// Charger les données mock initiales
const mockDataPath = path.join(__dirname, 'mockData.json');
let mockData;
try {
    const rawData = fs.readFileSync(mockDataPath, 'utf8');
    mockData = JSON.parse(rawData);
    console.log('Données mockData chargées:', mockData);
} catch (error) {
    console.error('Erreur lors du chargement de mockData.json:', error);
    mockData = { users: [] };
}

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

// Stocker les connexions des utilisateurs
const userSockets = new Map();

app.get('/', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

// Routes pour les utilisateurs
app.get('/api/users', (req, res) => {
    res.json(mockData.users);
});

app.get('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const user = mockData.users.find(u => u.id === id);
    if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
});

app.post('/api/users', (req, res) => {
    try {
        console.log('Requête d\'inscription reçue:', req.body);
        const { username, email, password } = req.body;
        
        // Validation des données
        if (!username || !email || !password) {
            console.log('Données manquantes');
            return res.status(400).json({ 
                message: 'Tous les champs sont requis (username, email, password)' 
            });
        }
        
        // Vérifier si l'utilisateur existe déjà
        const userExists = mockData.users.find(
            u => u.username === username || u.email === email
        );
        
        if (userExists) {
            console.log('Utilisateur existe déjà');
            return res.status(400).json({ 
                message: 'Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà' 
            });
        }

        // Créer le nouvel utilisateur
        const newUser = {
            id: mockData.users.length > 0 ? Math.max(...mockData.users.map(u => u.id)) + 1 : 1,
            username,
            email,
            password,
            admin: 0
        };

        // Ajouter l'utilisateur aux données en mémoire
        mockData.users.push(newUser);
        console.log('Nouvel utilisateur créé:', newUser);

        // Retourner l'utilisateur sans le mot de passe
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({
            message: 'Inscription réussie',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la création de l\'utilisateur' 
        });
    }
});

// Routes pour les messages
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

// Routes pour les activités
app.get('/api/activites', (req, res) => {
    res.json(mockData.activites);
});

app.get('/api/activites/id', (req, res) => {
    res.json(mockData.activites);
});

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

// Gestion des sockets
io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');

    socket.on('login', (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`Utilisateur ${userId} connecté avec socket ${socket.id}`);
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
        console.log('Un utilisateur s\'est déconnecté');
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

// Démarrer le serveur
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
