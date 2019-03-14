let Decimal = require('../common/crypto/decimal-light');

exports.isToken = function (symbol) {
  return (symbol.indexOf('.') !== -1 ? 1 : 0);
};

exports.fromInt = function (input, factor) {
  let f = Number(factor);
  let x = new Decimal(String(input));
  return x.times((f > 1 ? '0.' + new Array(f).join('0') : '') + '1');
};

exports.toInt = function (input, factor) {
  let f = Number(factor);
  let x = new Decimal(String(input));
  return x.times('1' + (f > 1 ? new Array(f + 1).join('0') : ''));
};

exports.formatFloat = function (n) {
  return String(Number(n));
};
