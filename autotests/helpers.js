const request = require('supertest');
const app = require('../server');

async function login(username, password){
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username, password });
  if(!res.body.success){
    throw new Error(`Login failed for ${username}: ${res.body.mensaje}`);
  }
  return res.body.token;
}

module.exports = { login };
