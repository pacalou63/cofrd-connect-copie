const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateAdminPassword() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion réussie!');
    
    // Le mot de passe que vous voulez utiliser
    const plainPassword = 'admin12';
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log('Mot de passe haché:', hashedPassword);
    
    // Mettre à jour l'utilisateur directement dans la collection users
    const usersCollection = mongoose.connection.db.collection('users');
    const result = await usersCollection.updateOne(
      { email: 'admin@cofrd.fr' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('Résultat de la mise à jour:', result);
    
    if (result.modifiedCount > 0) {
      console.log('Mot de passe mis à jour avec succès!');
    } else {
      console.log('Aucun utilisateur mis à jour. Vérifiez l\'email.');
    }
    
    // Vérifier l'utilisateur
    const user = await usersCollection.findOne({ email: 'admin@cofrd.fr' });
    console.log('Utilisateur après opération:', user ? 'Trouvé' : 'Non trouvé');
    if (user) {
      console.log('ID:', user._id);
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Admin:', user.admin);
      console.log('Password (haché):', user.password);
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

updateAdminPassword();