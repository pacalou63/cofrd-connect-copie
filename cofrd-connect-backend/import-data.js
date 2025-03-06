const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Activite = require('./models/activite');
require('dotenv').config();

async function importData() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion réussie!');
    
    // Lire le fichier mockData.json
    const mockDataPath = path.join(__dirname, 'mockData.json');
    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    
    // Vérifier si les collections sont vides
    const usersCount = await User.countDocuments();
    const activitesCount = await Activite.countDocuments();
    
    console.log(`Nombre d'utilisateurs existants: ${usersCount}`);
    console.log(`Nombre d'activités existantes: ${activitesCount}`);
    
    if (usersCount === 0) {
      console.log('Importation des utilisateurs...');
      
      // Créer un tableau de promesses pour l'importation des utilisateurs
      const userPromises = mockData.users.map(async (userData) => {
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Créer un nouvel utilisateur avec le modèle Mongoose
        const user = new User({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          admin: userData.admin
        });
        
        // Sauvegarder l'utilisateur
        return user.save();
      });
      
      // Attendre que tous les utilisateurs soient importés
      const savedUsers = await Promise.all(userPromises);
      console.log(`${savedUsers.length} utilisateurs importés avec succès!`);
    } else {
      console.log('Des utilisateurs existent déjà, importation ignorée.');
    }
    
    if (activitesCount === 0) {
      console.log('Importation des activités...');
      
      // Récupérer tous les utilisateurs pour les références
      const users = await User.find({});
      const userMap = {};
      users.forEach(user => {
        userMap[user.username] = user._id;
      });
      
      // Créer un tableau de promesses pour l'importation des activités
      const activitePromises = mockData.activites.map(async (activiteData) => {
        // Créer une nouvelle activité avec le modèle Mongoose
        const activite = new Activite({
          libelleActivite: activiteData.libelleActivite,
          description: activiteData.description,
          lieu: activiteData.lieu,
          date: activiteData.date || new Date(),
          heure: activiteData.heure || '14:00',
          participants: [], // Initialiser avec une liste vide
          statut: activiteData.statut || 'À venir'
        });
        
        // Sauvegarder l'activité
        return activite.save();
      });
      
      // Attendre que toutes les activités soient importées
      const savedActivites = await Promise.all(activitePromises);
      console.log(`${savedActivites.length} activités importées avec succès!`);
    } else {
      console.log('Des activités existent déjà, importation ignorée.');
    }
    
    // Vérifier les données après importation
    const usersAfter = await User.find({});
    const activitesAfter = await Activite.find({});
    
    console.log(`Nombre d'utilisateurs après importation: ${usersAfter.length}`);
    console.log(`Nombre d'activités après importation: ${activitesAfter.length}`);
    
    mongoose.connection.close();
    console.log('Importation terminée!');
  } catch (error) {
    console.error('Erreur lors de l\'importation des données:', error);
  }
}

importData();
