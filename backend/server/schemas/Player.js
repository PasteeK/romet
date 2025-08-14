const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const playerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
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

playerSchema.set('toJSON', {
    transform: (_, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret
    }
});
playerSchema.set('toObject', {
    transform: (_, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret
    }
});

module.exports = mongoose.model('Player', playerSchema);
