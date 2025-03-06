const mongoose = require('mongoose');

const activiteSchema = new mongoose.Schema({
    idActivite: {
        type: Number,
        required: false
    },
    libelleActivite: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    heure: {
        type: String,
        default: '14:00'
    },
    lieu: {
        type: String,
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    statut: {
        type: String,
        enum: ['À venir', 'En cours', 'Terminée', 'Annulée'],
        default: 'À venir'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Activite = mongoose.model('Activite', activiteSchema);

module.exports = Activite;
