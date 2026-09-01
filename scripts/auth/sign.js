import './server/env.js';
import signature from 'cookie-signature';
console.log('s:' + signature.sign('64178e594970ece25d18f6ead43ec33a7a718f017cafbf8ecbbf01ffae4556fe', process.env.SESSION_SECRET));
