const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// Route pour récupérer les messages d'un utilisateur
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        console.log(`Récupération des messages pour l'utilisateur: ${userId}`);
        
        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Récupérer les messages où l'utilisateur est l'expéditeur ou le destinataire
        const messages = await Message.find({
            $or: [
                { from: userId },
                { to: userId }
            ]
        }).sort({ timestamp: 1 });
        
        console.log(`Nombre de messages trouvés: ${messages.length}`);
        
        // Organiser les messages par conversation
        const conversations = {};
        
        for (const message of messages) {
            const otherUserId = message.from === userId ? message.to : message.from;
            
            if (!conversations[otherUserId]) {
                // Récupérer les informations de l'autre utilisateur
                const otherUser = await User.findOne({ _id: otherUserId });
                
                conversations[otherUserId] = {
                    user: otherUser ? {
                        id: otherUser._id,
                        username: otherUser.username
                    } : { id: otherUserId, username: 'Utilisateur inconnu' },
                    messages: []
                };
            }
            
            conversations[otherUserId].messages.push({
                id: message._id,
                from: message.from,
                message: message.text,
                timestamp: message.timestamp
            });
        }
        
        // Convertir l'objet en tableau
        const result = Object.values(conversations);
        
        res.json(result);
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Route pour envoyer un message
router.post('/', async (req, res) => {
    try {
        const { from, to, text, id } = req.body;
        
        console.log('Nouveau message reçu via API REST:', { from, to, text });
        
        if (!from || !to || !text) {
            return res.status(400).json({ message: 'Champs manquants (from, to, text)' });
        }
        
        // Créer et sauvegarder le message
        const newMessage = new Message({
            _id: id || new mongoose.Types.ObjectId(),
            from,
            to,
            text,
            timestamp: new Date()
        });
        
        const savedMessage = await newMessage.save();
        console.log('Message sauvegardé avec succès:', savedMessage);
        
        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
