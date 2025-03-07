const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Route pour obtenir tous les utilisateurs (sans les mots de passe)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Route pour obtenir un utilisateur par ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Route de login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('Tentative de connexion pour:', username);
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe requis' });
        }
        
        // Rechercher l'utilisateur
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('Utilisateur non trouvé:', username);
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Vérifier le mot de passe (en production, utilisez bcrypt)
        if (user.password !== password) {
            console.log('Mot de passe incorrect pour:', username);
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }
        
        console.log('Connexion réussie pour:', username);
        
        // Retourner les informations de l'utilisateur sans le mot de passe
        const userWithoutPassword = {
            id: user._id,
            username: user.username,
            admin: user.admin
        };
        
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Erreur de connexion:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Route pour créer un utilisateur
router.post('/', async (req, res) => {
    try {
        const { username, password, admin } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe requis' });
        }
        
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
        }
        
        // Créer un nouvel utilisateur
        const newUser = new User({
            username,
            password, // En production, hasher le mot de passe avec bcrypt
            admin: admin || 0
        });
        
        await newUser.save();
        
        // Retourner les informations de l'utilisateur sans le mot de passe
        const userWithoutPassword = {
            id: newUser._id,
            username: newUser.username,
            admin: newUser.admin
        };
        
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
