const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('Tentative de connexion à MongoDB avec URI:', 
            process.env.MONGODB_URI ? 
            process.env.MONGODB_URI.substring(0, 20) + '...' : 
            'Non défini');
        
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI n\'est pas défini dans les variables d\'environnement');
        }
        
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
            console.error('Erreur de connexion Mongoose détaillée:', err);
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
        console.error('Erreur de connexion à MongoDB:', error.message);
        console.error('Stack trace:', error.stack);
        // Ne pas quitter le processus, mais permettre à l'application de continuer
        // avec une gestion d'erreur appropriée
    }
};

module.exports = connectDB;
