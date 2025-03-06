const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find({});
    console.log('Utilisateurs dans la base de données:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Admin: ${user.admin} - Password: ${user.password ? 'Hashé' : 'Non défini'}`);
    });
    
    // Vérifier si l'utilisateur admin existe
    const adminUser = await User.findOne({ email: 'admin@cofrd.fr' });
    if (adminUser) {
      console.log('\nUtilisateur admin trouvé:');
      console.log(`- Username: ${adminUser.username}`);
      console.log(`- Email: ${adminUser.email}`);
      console.log(`- Admin: ${adminUser.admin}`);
      console.log(`- Password: ${adminUser.password ? 'Hashé' : 'Non défini'}`);
    } else {
      console.log('\nUtilisateur admin non trouvé!');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkUsers();
