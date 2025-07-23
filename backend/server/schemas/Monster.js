const mongoose = require('mongoose');

const monsterSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    hp: {
        type: Number,
        required: true
    },
    attack: {
        type: Number
    },
    skill: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('Monster', monsterSchema);