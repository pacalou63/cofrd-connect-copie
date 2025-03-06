const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    console.log('Connexion à MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion réussie!');
    
    // Vérifier la base de données
    const dbName = mongoose.connection.db.databaseName;
    console.log('Nom de la base de données:', dbName);
    
    // Vérifier les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections dans la base de données:');
    collections.forEach(collection => {
      console.log(' -', collection.name);
    });
    
    // Vérifier les utilisateurs
    if (collections.some(c => c.name === 'users')) {
      const users = await mongoose.connection.db.collection('users').find({}).toArray();
      console.log('Nombre d\'utilisateurs:', users.length);
      users.forEach(user => {
        console.log('---');
        console.log('ID:', user._id);
        console.log('Username:', user.username);
        console.log('Email:', user.email);
        console.log('Admin:', user.admin);
        console.log('Password (haché):', user.password);
      });
    } else {
      console.log('La collection "users" n\'existe pas.');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Erreur lors de la vérification de la base de données:', error);
  }
}

checkDatabase();
