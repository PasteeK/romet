const PlayerSchema = require('../schemas/Player')
const mongoose = require('mongoose')

// Service permettant de récupérer tous les joueurs
const getAllPlayers = async () => {
    return await PlayerSchema.find()
}

// Service permettant de créer un joueur
const createPlayer = async (player) => {
    const { username, email, password, confirmPassword, role } = player;

    if (password !== confirmPassword) {
        const err = new Error('Les mots de passe ne correspondent pas');
        err.status = 400;
        throw err;
    }

    // 🔎 Vérification proactive
    const existingPlayer = await Player.findOne({ $or: [{ email }, { username }] });
    if (existingPlayer) {
        let champConflit = existingPlayer.email === email ? 'email' : 'username';
        const err = new Error(`Le ${champConflit} est déjà utilisé.`);
        err.status = 400;
        throw err;
    }

    try {
        const newPlayer = new Player({ username, email, password, role });
        return await newPlayer.save();
    } catch (err) {
        err.status = 500;
        throw err;
    }
};

// Service permettant de mettre à jour un joueur par son id
const updatePlayer = async (id, player) => {
    return await PlayerSchema.findByIdAndUpdate(id, player)
}

module.exports = {
    getAllPlayers,
    createPlayer,
    updatePlayer
}

