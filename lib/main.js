const defaultHostname = 'http://127.0.0.1:1111/';

require('./globals');
const stdio = require('stdio');
const ProgressBar = require('progress');

const lang = require('./lang');
const input = require('./input');
const view = require('./views/interface/interface');

const Hybrix = require('../interface/hybrix-lib.nodejs.js');
hybrix = new Hybrix.Interface({http: require('http'), https: require('https'), storage: './storage'}); // Session needs to be available globally

let bar;

/**
 * @param title
 */
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
const ops = stdio.getopt({
  'hostname': {key: 'h', args: 1, description: 'The hostname to use. Default: http://127.0.0.1:1111/'},
  'userid': {key: 'u', args: 1, description: 'Set username'},
  'passwd': {key: 'p', args: 1, description: 'Set password'}
});

// let there be a default hostname if empty
let hostname = ops.hostname || defaultHostname;

/**
 * @param username
 * @param password
 */
function login (username, password) {
  hybrix.sequential(
    [
      {username: username || 'POMEW4B5XACN3ZCX', password: password || 'TVZS7LODA5CSGP6U'}, 'session', // TODO remove hardcoded
      {host: hostname}, 'login'
    ]
    , () => {
      global.logger(['info', 'login'], 'Succesfully logged in');
      view.activate(username || 'POMEW4B5XACN3ZCX'); // TODO remove hardcoded
    }
    , error => console.log('Error: ' + error)
    , progress => bar.update(progress)
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
