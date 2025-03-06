require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

// Fonction pour tester l'ajout d'un utilisateur
const testAddUser = async () => {
    try {
        // Se connecter à MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log(`Connecté à MongoDB: ${mongoose.connection.host}`);
        
        // Créer un utilisateur de test avec un timestamp pour éviter les doublons
        const timestamp = Date.now();
        const testUser = new User({
            username: `testuser_${timestamp}`,
            email: `test_${timestamp}@example.com`,
            password: 'password123'
        });
        
        // Sauvegarder l'utilisateur
        const savedUser = await testUser.save();
        
        console.log('Utilisateur de test créé avec succès:');
        console.log({
            id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            createdAt: savedUser.createdAt
        });
        
        // Vérifier que l'utilisateur a bien été ajouté
        const foundUser = await User.findById(savedUser._id);
        
        if (foundUser) {
            console.log('\nUtilisateur retrouvé dans la base de données:');
            console.log({
                id: foundUser._id,
                username: foundUser.username,
                email: foundUser.email
            });
            console.log('\nTest réussi! L\'utilisateur a été correctement ajouté à la base de données.');
        } else {
            console.error('\nErreur: Impossible de retrouver l\'utilisateur créé.');
        }
    } catch (error) {
        console.error('Erreur lors du test:');
        console.error(error);
    } finally {
        // Fermer la connexion
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('\nConnexion fermée.');
        }
        process.exit(0);
    }
};

// Exécuter le test
testAddUser();
