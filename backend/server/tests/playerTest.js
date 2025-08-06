const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test'), override: true });

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const Player = require('../schemas/Player');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Player API', () => {

  before(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    await Player.deleteMany({});
  });

  after(async () => {
    await mongoose.connection.close();
  });

  describe('GET /players', () => {
    it('should get an empty array', async () => {
      const response = await chai.request(app).get('/players');
      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array').that.is.empty;
    });
  });

  describe('POST /players/add', () => {
    it('should create a new player', async () => {
      const newPlayer = {
        username: 'test',
        email: 'test@example.com',
        password: 'password'
      };

      const response = await chai.request(app).post('/players').send(newPlayer);

      expect(response).to.have.status(201);
      expect(response.body).to.include({
        username: 'test',
        email: 'test@example.com'
      });
      expect(response.body).to.have.property('_id');
    });
  });

});
