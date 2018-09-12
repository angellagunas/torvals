import React, { Component } from 'react'
import { injectIntl } from 'react-intl'

class Footer extends Component {
  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }
  render () {
    return (
      <footer className='footer'>
        <div className='container'>
          <div className='columns is-mobile is-multiline'>
            <div className='column is-narrow'>
              <p><img src='/app/public/img/abraxas.png' width='140px' /></p>
              <a href='http://www.grupoabraxas.com' target='_blank'>
                www.grupoabraxas.com
                </a>
            </div>
            <div className='column is-12-mobile'>
              <p>Donato Guerra 9, Progreso Tizapán, Ciudad de México, CDMX</p>
            </div>
            <div className='column has-text-right'>
              <p className='top-small'>
                <span>
                  <a href='/privacy' target='_self'>
                    { this.formatTitle('landing.privacy') }
                  </a>
                </span>
              </p>
              <p>
                { this.formatTitle('landing.rights') }
              </p>
            </div>
          </div>
        </div>
      </footer>
    )
  }
}

export default injectIntl(Footer)
