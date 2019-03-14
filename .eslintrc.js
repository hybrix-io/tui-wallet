module.exports = {
  'plugins': ['standard'],
  'env': {
    'browser': true,
    'es6': true,
    'node': true
  },
  'extends': 'semistandard',
  'parserOptions': {
    'sourceType': 'module'
  },
  'rules': {
    'no-undef': 1,
    'no-global-assign': 1,
    'no-unused-vars': 1,
    'camelcase': 1,
    'no-var': 1,
    'no-eval': 0,
    'object-curly-spacing': 0,
    'new-cap': 0
  }
};
