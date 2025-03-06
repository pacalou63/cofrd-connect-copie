const mongoose = require('mongoose');
const User = require('./models/user');
const Activite = require('./models/activite');
const Message = require('./models/message');
require('dotenv').config();

async function resetDatabase() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion réussie!');
    
    // Supprimer toutes les activités
    const activitesResult = await Activite.deleteMany({});
    console.log(`${activitesResult.deletedCount} activités supprimées`);
    
    // Supprimer tous les utilisateurs
    const usersResult = await User.deleteMany({});
    console.log(`${usersResult.deletedCount} utilisateurs supprimés`);
    
    // Supprimer tous les messages
    const messagesResult = await Message.deleteMany({});
    console.log(`${messagesResult.deletedCount} messages supprimés`);
    
    console.log('Base de données réinitialisée avec succès!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Erreur lors de la réinitialisation de la base de données:', error);
  }
}

resetDatabase();
