const mongoose = require('mongoose');

const handSchema = new mongoose.Schema({
    cards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
    }]
}, { timestamps: true })

module.exports = mongoose.model('Hand', handSchema);