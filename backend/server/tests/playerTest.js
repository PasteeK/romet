const mongoose = require('mongoose');
const playerService = require('../services/playerService');
const config = require('../config')
const should = require('should');

const playerValidSchema = {
  username: 'testplayer',
  email: 'test@example.com',
  password: 'securepassword'
};

before(async () => {
  const connection = await mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await connection.connection.db.dropDatabase();

  const modelPromises = Object.values(mongoose.models).map(model => model.syncIndexes());
  await Promise.all(modelPromises);
});

describe('PlayerService - CreatePlayer', function() {
  it('should add a player', async function () {
    const result = await playerService.createPlayer(playerValidSchema);

    result.should.have.property('username', playerValidSchema.username);
    result.should.have.property('email', playerValidSchema.email);
    result.should.have.property('password');
    result.should.have.property('_id');

    playerValidSchema._id = result._id;
  });
});