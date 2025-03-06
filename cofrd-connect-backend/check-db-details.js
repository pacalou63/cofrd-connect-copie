const mongoose = require('mongoose');
const User = require('./models/user');
const Activite = require('./models/activite');
require('dotenv').config();

async function checkDatabaseDetails() {
  try {
    console.log('Connexion à MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion réussie!');
    
    // Vérifier le nom de la base de données
    const dbName = mongoose.connection.db.databaseName;
    console.log('Nom de la base de données:', dbName);
    
    // Vérifier l'hôte
    const host = mongoose.connection.host;
    console.log('Hôte MongoDB:', host);
    
    // Vérifier les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections dans la base de données:');
    collections.forEach(collection => {
      console.log(' -', collection.name);
    });
    
    // Vérifier les utilisateurs
    const users = await User.find({});
    console.log(`Nombre d'utilisateurs: ${users.length}`);
    if (users.length > 0) {
      console.log('Premier utilisateur:');
      console.log(' - Username:', users[0].username);
      console.log(' - Email:', users[0].email);
      console.log(' - Admin:', users[0].admin);
    }
    
    // Vérifier les activités
    const activites = await Activite.find({});
    console.log(`Nombre d'activités: ${activites.length}`);
    if (activites.length > 0) {
      console.log('Première activité:');
      console.log(' - Libellé:', activites[0].libelleActivite);
      console.log(' - Description:', activites[0].description);
      console.log(' - Lieu:', activites[0].lieu);
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Erreur lors de la vérification de la base de données:', error);
  }
}

checkDatabaseDetails();
