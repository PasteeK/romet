const mongoose = require('mongoose');

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