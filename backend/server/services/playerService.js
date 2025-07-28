const PlayerSchema = require('../schemas/Player')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

    const user = await PlayerSchema.findById(req.user.id).select('username email gamesPlayed');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ pseudo: user.username, email: user.email, gamesPlayed: user.gamesPlayed });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Service permettant de se connecter
const login = async (username, password) => {
  const player = await PlayerSchema.findOne({ username });
  if (!player) {
    throw new Error('Invalid username or password');
  }

  const isPasswordValid = await bcrypt.compare(password, player.password);
  if (!isPasswordValid) {
    throw new Error('Invalid username or password');
  }

  const token = jwt.sign({ id: player._id }, process.env.JWT_SECRET);
  return token;
};

// Service permettant de supprimer un joueur
const deletePlayer = async (id) => {
  console.log('🗑️ Player deleted:', id);
  return await PlayerSchema.findByIdAndDelete(id)
}

// Service permettant de supprimer un joueur par son id
const deletePlayerById = async (id) => {
  console.log('🗑️ Player deleted:', id);
  return await PlayerSchema.findByIdAndDelete(id)
}

module.exports = {
    getAllPlayers,
    createPlayer,
    updatePlayer,
    getMe,
    login,
    deletePlayer,
    deletePlayerById
}

