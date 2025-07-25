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
    const user = await Player.findById(req.user.id).select('username email gamesPlayed');
    if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    console.log('🎮 Games Played:', user.gamesPlayed);
    res.json({ pseudo: user.username, email: user.email, gamesPlayed: user.gamesPlayed });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Controlleur permettant d'incrementer le nombre de parties jouées
const incrementGamesPlayed = async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.user.id,
      { $inc: { gamesPlayed: 1 } },
      { new: true }
    ).select('gamesPlayed');

    if (!updatedPlayer) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ gamesPlayed: updatedPlayer.gamesPlayed });
  } catch (err) {
    console.error('Erreur update gamesPlayed :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
    getAllPlayers,
    createPlayer,
    updatePlayer,
    getMe,
    incrementGamesPlayed
}