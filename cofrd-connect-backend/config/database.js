const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 // Timeout après 5 secondes
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Ajouter des événements pour surveiller la connexion
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connecté à la base de données');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('Erreur de connexion Mongoose:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose déconnecté de la base de données');
        });
        
        // Intercepter les signaux de fermeture pour fermer proprement la connexion
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Connexion à la base de données fermée suite à l\'arrêt de l\'application');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Erreur de connexion à MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
