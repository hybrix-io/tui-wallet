require('./globals');
let stdio = require('stdio');
let ProgressBar = require('progress');
let bar;

function makeProgressBar (title) {
  bar = new ProgressBar(' [.] ' + title + ': [:bar] :percent, eta: :etas', {
    complete: '▓',
    incomplete: '░',
    width: 76 - title.length,
    total: 100
  });
}

// show progress
makeProgressBar('Loading Wallet');

// command line options and init
let ops = stdio.getopt({
  'hostname': {key: 'h', args: 1, description: 'The hostname to use. Default: http://127.0.0.1:1111/'},
  'userid': {key: 'u', args: 1, description: 'Set username'},
  'passwd': {key: 'p', args: 1, description: 'Set password'}
});

// let there be a default hostname if empty
let defaultHostname = 'http://127.0.0.1:1111/';
let hostname = ops.hostname || defaultHostname;

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
        {host: hostname}, 'login' // TODO ROUKE -> configuration
      ]
      , () => { view.activate(username || 'POMEW4B5XACN3ZCX'); }
      , e => { console.log('Error: ' + e); }
      , (progress) => { bar.update(progress); }
    );
  });
});
