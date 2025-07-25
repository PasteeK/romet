const PlayerSchema = require('../schemas/Player')

// Service permettant de récupérer tous les joueurs
const getAllPlayers = async () => {
    return await PlayerSchema.find()
}

// Service permettant de créer un joueur
const createPlayer = async (player) => {
    return await PlayerSchema.create(player)
};

// Service permettant de mettre à jour un joueur par son id
const updatePlayer = async (id, player) => {
    return await PlayerSchema.findByIdAndUpdate(id, player)
}

// Service permettant de récupérer un joueur par son id
const getMe = async (req, res) => {
    console.log('🆔 ID extrait du token :', req.user.id);
  try {

    const user = await Player.findById(req.user.id).select('username email gamesPlayed');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ pseudo: user.username, email: user.email, gamesPlayed: user.gamesPlayed });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
    getAllPlayers,
    createPlayer,
    updatePlayer,
    getMe
}

