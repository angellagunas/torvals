import React from 'react'
import ReactDOM from 'react-dom'
import Router from './router'

import './styles/index.scss'

const render = (Root) => {
  ReactDOM.render(Root, document.getElementById('root'))
}

if (module.hot) {
  module.hot.accept('./router.js', function (Root) {
    const Router = require('./router')
    render(<Router.default />)
  })
}

if (!window.intl) {
  // Load the polyfill if there is no native browser support for Intl
  // Safari...
  require.ensure([
    'intl',
    'intl/locale-data/jsonp/en.js',
    'intl/locale-data/jsonp/es.js'
  ], (require) => {
    require('intl')
    require('intl/locale-data/jsonp/en.js')
    require('intl/locale-data/jsonp/es.js')
    render(<Router />)
  })
} else {
  render(<Router />)
}
