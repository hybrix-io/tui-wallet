require('./globals');

let lang = require('./lang');
let input = require('./input');
let view = require('./views/interface/interface');

let Hybrix = require('../interface/hybrix-lib.nodejs.js');
hybrix = new Hybrix.Interface({http: require('http')}); // Session needs to be available globally
let UI = require('./ui');

input.read(lang.viewLoginUser, {capitalize: true}, (e, username) => {
  input.read(lang.viewLoginPass, {password: true}, (e, password) => {
    hybrix.sequential(
      [
        'init',
        //        {username:username,password:password}, 'session', //TODO ROUKE
        {username: username || 'POMEW4B5XACN3ZCX', password: password || 'TVZS7LODA5CSGP6U'}, 'session', // TODO ROUKE
        {host: 'http://localhost:1111/'}, 'login' // TODO ROUKE -> configuration
      ]
      , () => { view.activate(username || 'POMEW4B5XACN3ZCX'); }
      , e => { console.log('Error: ' + e); }
    );
  });
});
