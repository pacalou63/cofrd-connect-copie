require('dotenv').config();
const mongoose = require('mongoose');
const Activite = require('./models/activite');
const User = require('./models/user'); 

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur MongoDB:', err));

const activiteTest = new Activite({
  libelleActivite: 'Réunion test',
  description: 'Une réunion de test pour vérifier la connexion MongoDB',
  date: new Date(),
  lieu: 'Salle de conférence'
});

activiteTest.save()
  .then(doc => {
    console.log('Activité créée:', doc);
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
