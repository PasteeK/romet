const playerService = require('../services/playerService');

// Controlleur permettant de récupérer tous les joueurs
const getAllPlayers = async (req, res) => {
    try {
        const players = await playerService.getAllPlayers();
        res.status(200).json(players);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Controlleur permettant de créer un joueur
const createPlayer = async (req, res) => {
    try {
        const player = await playerService.createPlayer(req.body);
        res.status(201).json(player);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Controlleur permettant de mettre à jour un joueur
const updatePlayer = async (req, res) => {
    try {
        const player = await playerService.updatePlayer(req.params.id, req.body);
        res.status(200).json(player);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getAllPlayers,
    createPlayer,
    updatePlayer
}