module.exports = {
  'extends': 'airbnb',
  'env': {
    'browser': true,
    'node': true
  },
  'rules': {
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'react/jsx-filename-extension': [
      1,
      {
        'extensions': ['.js', '.jsx']
      }
    ]
  }
}
