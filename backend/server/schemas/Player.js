const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const playerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    gamesPlayed: {
        type: Number,
        default: 0
    },
    savegame: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Savegame',
    },
    role: {
        type: String,
        enum: [
            'user',
            'admin'
        ],
        default: 'user'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

playerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err); 
  }
});

module.exports = mongoose.model('Player', playerSchema);
