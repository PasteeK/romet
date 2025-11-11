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
    const { modified, player } = await playerService.updatePlayer(req.params.id, req.body);
    res.status(200).json({ modified, player });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid user id' });
    if (err.code === 11000) return res.status(409).json({ message: 'Username or email already exists' });
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};


// Controlleur permettant de récupérer un joueur par son id
const getMe = async (req, res) => {
  try {
    const user = await Player.findById(req.user.id)
      .select('username email gamesPlayed preferences');
    if (!user) return res.status(404).json({ message: 'user not found' });

    res.json({
      pseudo: user.username,
      email: user.email,
      gamesPlayed: user.gamesPlayed,
      preferences: user.preferences
    });
  } catch (err) {
    res.status(500).json({ message: 'Servor error' });
  }
};

// Controlleur permettant de mettre à jour les préférences du joueur
const setTutorial = async (req, res) => {
  try {
    const { action } = req.body || {};
    const prefs = await playerService.setTutorialState(
      req.user.id,
      action,
    );
    res.status(200).json({ preferences: prefs });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
  }
};

// Controlleur permettant d'incrementer le nombre de parties jouées via l'opérateur $inc fournit par mongoose
const incrementGamesPlayed = async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.user.id,
      { $inc: { gamesPlayed: 1 } },
      { new: true }
    ).select('gamesPlayed');

    if (!updatedPlayer) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ gamesPlayed: updatedPlayer.gamesPlayed });
  } catch (err) {
    console.error('error incrementing gamesPlayed :', err);
    res.status(500).json({ message: 'Servor error' });
  }
};

// Controlleur permettant de se connecter
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const token = await playerService.login(username, password);
    res.status(200).json({ token });
  } catch (err) {
    console.error('Login failed:', err.message);
    res.status(401).json({ message: err.message });
  }
}

// Controlleur permettant de supprimer un joueur
const deletePlayer = async (req, res) => {
  // console.log('User to delete :', req.user);
  try {
    const userId = req.user.id;
    // console.log("Id debug : " + userId)
    const player = await playerService.deletePlayer(userId);
    res.status(200).json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Controlleur permettant de supprimer un joueur par son id
const deletePlayerById = async (req, res) => {
  try {
    const player = await playerService.deletePlayerById(req.params.id);
    res.status(200).json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
    getAllPlayers,
    createPlayer,
    updatePlayer,
    getMe,
    incrementGamesPlayed,
    login,
    deletePlayer,
    deletePlayerById,
    setTutorial
}