require('dotenv').config();
const mongoose = require('mongoose');
const Activite = require('./models/activite');
const mockData = require('./mockData.json');

async function importActivites() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connecté à MongoDB');

        // Supprimer toutes les activités existantes
        await Activite.deleteMany({});
        console.log('Anciennes activités supprimées');

        // Importer les nouvelles activités
        const activites = mockData.activites.map(act => ({
            libelleActivite: act.libelleActivite,
            description: act.description,
            lieu: act.lieu,
            date: new Date(act.date)
        }));

        const result = await Activite.insertMany(activites);
        console.log(`${result.length} activités importées avec succès`);

        // Afficher les activités importées
        const importedActivites = await Activite.find();
        console.log('Activités dans la base de données:', importedActivites);

        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

importActivites();
