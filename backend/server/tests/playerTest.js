const should = require('should');
const playerService = require('../services/playerService');
const PlayerModel = require('../schemas/Player');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const playerValidSchema = {
  username: 'testplayer',
  email: 'test@example.com',
  password: 'securepassword',
};

const storeOriginalMethods = (model, methodNames) => {
  const originals = {};
  methodNames.forEach((name) => {
    originals[name] = model[name];
  });
  return originals;
};

const restoreMethods = (model, originals) => {
  Object.entries(originals).forEach(([name, fn]) => {
    model[name] = fn;
  });
};

describe('PlayerService', function () {
  const methodsToMock = [
    'find',
    'create',
    'updateOne',
    'findById',
    'findByIdAndUpdate',
    'findByIdAndDelete',
    'findOne',
  ];
  const originals = storeOriginalMethods(PlayerModel, methodsToMock);
  const originalCompare = bcrypt.compare;
  const originalSign = jwt.sign;
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(function () {
    restoreMethods(PlayerModel, originals);
    bcrypt.compare = originalCompare;
    jwt.sign = originalSign;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('should create a player with createPlayer', async function () {
    const doc = clone(playerValidSchema);
    PlayerModel.create = async (payload) => {
      payload.should.eql(doc);
      return { ...payload, _id: 'player-id' };
    };

    const result = await playerService.createPlayer(doc);

    result.should.have.properties({
      username: doc.username,
      email: doc.email,
      _id: 'player-id',
    });
    result.should.have.property('password');
  });

  it('should return all players with getAllPlayers', async function () {
    const players = [
      { _id: '1', username: 'alice' },
      { _id: '2', username: 'bob' },
    ];
    PlayerModel.find = async () => players;

    const result = await playerService.getAllPlayers();

    result.should.eql(players);
  });

  it('should update allowed fields and return the player with updatePlayer', async function () {
    PlayerModel.updateOne = async (filter, update) => {
      filter.should.have.property('_id', 'player-id');
      update.should.have.property('$set');
      update.$set.should.have.properties({ username: 'updated' });
      update.$set.should.not.have.property('role');
      return { matchedCount: 1, modifiedCount: 1 };
    };

    PlayerModel.findById = () => ({
      select: () =>
        Promise.resolve({
          _id: 'player-id',
          username: 'updated',
          email: 'test@example.com',
        }),
    });

    const result = await playerService.updatePlayer('player-id', {
      username: 'updated',
      role: 'admin',
    });

    result.should.have.properties({ modified: true });
    result.player.should.have.properties({
      _id: 'player-id',
      username: 'updated',
      email: 'test@example.com',
    });
  });

  it('should throw when updatePlayer is called without id', async function () {
    try {
      await playerService.updatePlayer('', { username: 'nope' });
      throw new Error('Expected updatePlayer to throw');
    } catch (err) {
      err.should.be.Error().and.have.property('message', 'Missing user id');
      err.should.have.property('status', 400);
    }
  });

  it('should throw when updatePlayer has no allowed fields', async function () {
    try {
      await playerService.updatePlayer('player-id', { role: 'admin' });
      throw new Error('Expected updatePlayer to throw');
    } catch (err) {
      err.should.be.Error().and.have.property('message', 'No updatable fields in body');
      err.should.have.property('status', 400);
    }
  });

  it('should throw when updatePlayer cannot find the user', async function () {
    PlayerModel.updateOne = async () => ({ matchedCount: 0, modifiedCount: 0 });

    try {
      await playerService.updatePlayer('missing', { username: 'ghost' });
      throw new Error('Expected updatePlayer to throw');
    } catch (err) {
      err.should.be.Error().and.have.property('message', 'User not found');
      err.should.have.property('status', 404);
    }
  });

  it('should enable the tutorial with setTutorialState', async function () {
    PlayerModel.findByIdAndUpdate = () => ({
      select: () => Promise.resolve({ preferences: { showTutorial: true } }),
    });

    const result = await playerService.setTutorialState('player-id', 'enable');

    result.should.eql({ showTutorial: true });
  });

  it('should disable the tutorial with setTutorialState', async function () {
    PlayerModel.findByIdAndUpdate = () => ({
      select: () => Promise.resolve({ preferences: { showTutorial: false } }),
    });

    const result = await playerService.setTutorialState('player-id', 'disable');

    result.should.eql({ showTutorial: false });
  });

  it('should throw for invalid tutorial action', async function () {
    try {
      await playerService.setTutorialState('player-id', 'unknown');
      throw new Error('Expected setTutorialState to throw');
    } catch (err) {
      err.should.be.Error().and.have.property('message', 'Invalid action');
      err.should.have.property('status', 400);
    }
  });

  it('should return a token on successful login', async function () {
    process.env.JWT_SECRET = 'secret';

    PlayerModel.findOne = ({ username }) => {
      username.should.equal('testplayer');
      return {
        select: () =>
          Promise.resolve({
            _id: 'player-id',
            username: 'testplayer',
            password: 'hashed',
          }),
      };
    };

    bcrypt.compare = async (plain, hash) => {
      plain.should.equal('securepassword');
      hash.should.equal('hashed');
      return true;
    };

    jwt.sign = (payload, secret, options) => {
      payload.should.have.property('id', 'player-id');
      secret.should.equal('secret');
      options.should.have.property('expiresIn', '1h');
      return 'token';
    };

    const token = await playerService.login('testplayer', 'securepassword');

    token.should.equal('token');
  });

  it('should throw when username is unknown on login', async function () {
    PlayerModel.findOne = () => ({
      select: () => Promise.resolve(null),
    });

    try {
      await playerService.login('unknown', 'password');
      throw new Error('Expected login to throw');
    } catch (err) {
      err.should.be.Error().and.have.property('message', 'Invalid username or password');
    }
  });

  it('should throw when password is invalid on login', async function () {
    PlayerModel.findOne = () => ({
      select: () =>
        Promise.resolve({
          _id: 'player-id',
          username: 'testplayer',
          password: 'hashed',
        }),
    });

    bcrypt.compare = async () => false;

    try {
      await playerService.login('testplayer', 'wrong');
      throw new Error('Expected login to throw');
    } catch (err) {
      err.should.be.Error().and.have.property('message', 'Invalid username or password');
    }
  });

  it('should respond with the player data in getMe', async function () {
    PlayerModel.findById = (id) => ({
      select: () =>
        Promise.resolve({
          _id: id,
          username: 'testplayer',
          email: 'test@example.com',
          gamesPlayed: 3,
        }),
    });

    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
      },
    };

    await playerService.getMe({ user: { id: 'player-id' } }, res);

    res.statusCode.should.equal(200);
    res.body.should.eql({
      pseudo: 'testplayer',
      email: 'test@example.com',
      gamesPlayed: 3,
    });
  });

  it('should respond with 404 when getMe cannot find the user', async function () {
    PlayerModel.findById = () => ({
      select: () => Promise.resolve(null),
    });

    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
      },
    };

    await playerService.getMe({ user: { id: 'missing' } }, res);

    res.statusCode.should.equal(404);
    res.body.should.eql({ message: 'User not found' });
  });

  it('should delete a player with deletePlayer', async function () {
    PlayerModel.findByIdAndDelete = async (id) => {
      id.should.equal('player-id');
      return { acknowledged: true };
    };

    const result = await playerService.deletePlayer('player-id');

    result.should.eql({ acknowledged: true });
  });

  it('should delete a player by id with deletePlayerById', async function () {
    PlayerModel.findByIdAndDelete = async (id) => {
      id.should.equal('player-id');
      return { acknowledged: true };
    };

    const result = await playerService.deletePlayerById('player-id');

    result.should.eql({ acknowledged: true });
  });
});
