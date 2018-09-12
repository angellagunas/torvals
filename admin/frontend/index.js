import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { IntlProvider, addLocaleData } from 'react-intl'
import Router from './router'
import en from 'react-intl/locale-data/en'
import es from 'react-intl/locale-data/es'
import { translations, flattenMessages } from './translations'

import './styles/index.scss'

addLocaleData([...en, ...es])

const lang = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage

const language = lang.toLowerCase().split(/[_-]+/)[0] || 'es'

class RouterInt extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locale: localStorage.getItem('lang') || language,
    };

    window.addEventListener('lang', this.changeLanguage);
  }

  changeLanguage = e => {
    this.setState({ locale: e.detail.lang });
    localStorage.setItem('lang', e.detail.lang);
  };

  render() {
    let { locale } = this.state;
    const { Root } = this.props;
    return (
      <IntlProvider
        locale={locale}
        messages={flattenMessages(translations[locale])}
      >
        <Root />
      </IntlProvider>
    );
  }
}

const render = (Root) => {
  ReactDOM.render(Root, document.getElementById('root'))
}

if (module.hot) {
  module.hot.accept('./router.js', function (Root) {
    const Router = require('./router')
    render(<RouterInt  Root={Router.default} />)
  })
}

if (!window.intl) {
  // Load the polyfill if there is no native browser support for Intl
  // Safari...
  require('intl')
  require('intl/locale-data/jsonp/en.js')
  require('intl/locale-data/jsonp/es.js')
  render(<RouterInt  Root={Router} />)
} else {
  render(<RouterInt  Root={Router} />)
}
