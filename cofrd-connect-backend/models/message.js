const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    from: {
        type: String, // Changé de ObjectId à String pour accepter les deux formats d'ID
        required: true
    },
    to: {
        type: String, // Changé de ObjectId à String pour accepter les deux formats d'ID
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
