const mongoose = require('mongoose');

const savegameSchema = new mongoose.Schema({
    score: {
        type: Number,
        required: true
    },
    mapPosition: {
        type: String,
        required: true
    },
    mapEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
    }],
    hand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hand',
    },
    deck: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deck',
    },
    money: {
        type: Number,
        required: true
    },
    discard: {
        type: Number,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Savegame', savegameSchema);