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
const pickAllowed = (obj, allowed) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => allowed.includes(k))
  );

// Service permettant de mettre à jour un joueur
const updatePlayer = async (id, data) => {
  const allowed = [
    'username','email','gamesPlayed','savegame','lastLogin',
    'preferences.showTutorial',
  ];
  const update = pickAllowed(data, allowed);

  if (!id) throw Object.assign(new Error('Missing user id'), { status: 400 });
  if (Object.keys(update).length === 0)
    throw Object.assign(new Error('No updatable fields in body'), { status: 400 });

  const result = await PlayerSchema.updateOne(
    { _id: id },
    { $set: update },
    { runValidators: true, context: 'query' }
  );
  if (result.matchedCount === 0)
    throw Object.assign(new Error('User not found'), { status: 404 });

  const fresh = await PlayerSchema
    .findById(id)
    .select('username email gamesPlayed role savegame lastLogin preferences createdAt updatedAt');

  return { modified: result.modifiedCount > 0, player: fresh };
};

// Service permettant d'afficher le tutoriel si le joueur le souhaite
const setTutorialState = async (id, action, tutorialVersion = 1) => {
  if (!id) throw Object.assign(new Error('Missing user id'), { status: 400 });

  let update = {};
  switch (action) {
    case 'enable':
      update = { 'preferences.showTutorial': true };
      break;
    case 'disable':
      update = { 'preferences.showTutorial': false };
      break;
    default:
      throw Object.assign(new Error('Invalid action'), { status: 400 });
  }

  const fresh = await PlayerSchema.findByIdAndUpdate(
    id, { $set: update }, { new: true }
  ).select('preferences');

  if (!fresh) throw Object.assign(new Error('User not found'), { status: 404 });
  return fresh.preferences;
};

// Service permettant de récupérer un joueur par son id
const getMe = async (req, res) => {
    // console.log('ID extrait du token :', req.user.id);
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
  const player = await PlayerSchema.findOne({ username }).select('+password');
  if (!player) {
    throw new Error('Invalid username or password');
  }

  const isPasswordValid = await bcrypt.compare(password, player.password);
  if (!isPasswordValid) {
    throw new Error('Invalid username or password');
  }

  PlayerSchema.findByIdAndUpdate(player._id, { lastLogin: new Date() }).catch(() => {});

  const token = jwt.sign({ id: player._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};

// Service permettant de supprimer un joueur
const deletePlayer = async (id) => {
  // console.log('Player deleted:', id);
  return await PlayerSchema.findByIdAndDelete(id)
}

// Service permettant de supprimer un joueur par son id
const deletePlayerById = async (id) => {
  // console.log('Player deleted:', id);
  return await PlayerSchema.findByIdAndDelete(id)
}

module.exports = {
    getAllPlayers,
    createPlayer,
    updatePlayer,
    getMe,
    login,
    deletePlayer,
    deletePlayerById,
    setTutorialState
}

