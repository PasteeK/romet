const mongoose = require('mongoose');

// Schéma d'une carte dans la base de données
const cardSchema = new mongoose.Schema({
    value: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Card', cardSchema);