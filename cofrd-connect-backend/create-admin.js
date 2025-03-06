const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin@cofrd.fr' });
    
    if (existingAdmin) {
      console.log('Un utilisateur admin existe déjà. Mise à jour du mot de passe...');
      
      // Mettre à jour le mot de passe
      existingAdmin.password = 'admin123';
      await existingAdmin.save();
      
      console.log('Mot de passe admin mis à jour avec succès!');
      console.log('Email: admin@cofrd.fr');
      console.log('Mot de passe: admin123');
    } else {
      // Créer un nouvel utilisateur admin
      const adminUser = new User({
        username: 'Admin',
        email: 'admin@cofrd.fr',
        password: 'admin123',
        admin: 1
      });
      
      await adminUser.save();
      
      console.log('Utilisateur admin créé avec succès!');
      console.log('Email: admin@cofrd.fr');
      console.log('Mot de passe: admin123');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur admin:', error);
  }
}

createAdminUser();
