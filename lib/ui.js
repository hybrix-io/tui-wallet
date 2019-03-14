exports.edit = { override: false, hist: [] };
exports.text = {};
exports.spinner = {test: {}};

exports.views = {};
exports.buttonfunc = require('./buttons'); // button functions
exports.modalfunc = require('./modal'); // modal functions

// global compatibility functions
exports.alert = function (title, text) {
  if (typeof text !== 'undefined') {
    UI.modalfunc.alert(title, text);
  } else {
    UI.modalfunc.alert(lang.alertTitle, title);
  }
};

exports.log = function (text) {
  if (typeof UI !== 'undefined' && typeof UI.logger !== 'undefined') {
    UI.logger.insertBottom(text);
  } else { console.log(text); }
};
