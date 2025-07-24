const playerService = require('../services/playerService');
const Player = require('../schemas/Player');

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

// Controlleur permettant de récupérer un joueur par son id
const getMe = async (req, res) => {
  try {
    console.log('🆔 ID extrait du token :', req.user.id);
    const user = await Player.findById(req.user.id).select('username email');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ pseudo: user.username, email: user.email });
  } catch (err) {
    console.error('❌ Erreur dans getMe:', err); // 👈 AJOUTE CECI
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
    getAllPlayers,
    createPlayer,
    updatePlayer,
    getMe
}