require('./globals');
let stdio = require('stdio');
let ProgressBar = require('progress');

let lang = require('./lang');
let input = require('./input');
let view = require('./views/interface/interface');

let Hybrix = require('../interface/hybrix-lib.nodejs.js');
hybrix = new Hybrix.Interface({http: require('http'), https: require('https')}); // Session needs to be available globally

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

function login (username, password) {
  hybrix.sequential(
    [
      'init',
      {username: username || 'POMEW4B5XACN3ZCX', password: password || 'TVZS7LODA5CSGP6U'}, 'session',
      {host: hostname}, 'login'
    ]
    , () => { view.activate(username || 'POMEW4B5XACN3ZCX'); }
    , e => { console.log('Error: ' + e); }
    , (progress) => { bar.update(progress); }
  );
}

if (!ops.userid) {
  if (!ops.passwd) {
    input.read(lang.viewLoginUser, {capitalize: true}, (e, username) => {
      input.read(lang.viewLoginPass, {password: true}, (e, password) => {
        login(username, password);
      });
    });
  } else {
    input.read(lang.viewLoginUser, {capitalize: true}, (e, username) => {
      login(username, ops.passwd);
    });
  }
} else {
  if (!ops.passwd) {
    input.read(lang.viewLoginPass, {password: true}, (e, password) => {
      login(ops.userid, password);
    });
  } else {
    login(ops.userid, ops.passwd);
  }
}
