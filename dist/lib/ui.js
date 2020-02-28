const modal = require('./modal'); // modal functions
const button = require('./buttons'); // button functions
const lang = require('./lang'); // button functions

exports.edit = { override: false, hist: [] };
exports.text = {};
exports.spinner = {test: {}};

exports.views = {};

exports.buttonfunc = button;
exports.modalfunc = modal;

// global compatibility functions
exports.alert = function (title, text) {
  if (typeof text !== 'undefined') {
    modal.alert(title, text);
  } else {
    modal.alert(lang.alertTitle, title);
  }
};

exports.log = function (text) {
  if (typeof UI !== 'undefined' && typeof UI.logger !== 'undefined') {
    UI.logger.insertBottom(text);
  } else { console.log(text); }
};
