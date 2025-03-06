const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const mockData = require('../cofrd-connect-frontend/src/mockData.json');

// Connexion directe à la base de données pour éviter le hachage automatique
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      console.log('Connexion à MongoDB réussie');
      
      // Accéder directement à la collection users (sans passer par le modèle)
      const usersCollection = mongoose.connection.db.collection('users');
      
      // Pour chaque utilisateur dans mockData
      for (const userData of mockData.users) {
        // Trouver l'utilisateur par email
        const existingUser = await usersCollection.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`Mise à jour du mot de passe pour ${userData.email}...`);
          
          // Hacher le mot de passe
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          
          // Mettre à jour le mot de passe dans la base de données
          await usersCollection.updateOne(
            { email: userData.email },
            { $set: { password: hashedPassword } }
          );
          
          console.log(`Mot de passe mis à jour pour ${userData.email}`);
          console.log(`Email: ${userData.email}, Mot de passe (non haché): ${userData.password}`);
        } else {
          console.log(`Utilisateur ${userData.email} non trouvé dans la base de données`);
        }
      }
      
      console.log('\nTous les mots de passe ont été mis à jour!');
      console.log('Vous pouvez maintenant vous connecter avec les mots de passe du fichier mockData.json');
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des mots de passe:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
  });
