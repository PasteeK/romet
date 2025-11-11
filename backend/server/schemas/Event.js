const mongoose = require('mongoose');

// Schéma d'un evenement dans la base de données
const eventSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    monster: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Monster',
    },
    healthRestored: {
        type: Number
    },
    cards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
    }]
}, { timestamps: true })

module.exports = mongoose.model('Event', eventSchema);