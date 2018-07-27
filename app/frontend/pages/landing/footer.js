import React, { Component } from 'react'

class Footer extends Component {
  render () {
    return (
      <footer className='footer'>
        <div className='container'>
          <div className='columns is-mobile is-multiline'>
            <div className='column is-narrow'>
              <img src='/app/public/img/abraxas-logo.svg' />
              <a href='http://www.grupoabraxas.com' target='blank'>
                www.grupoabraxas.com
                </a>
            </div>
            <div className='column is-12-mobile'>
              <p className='top-medium'>Orax powered by Common Sense People</p>
              <p>Donato Guerra 9, Progreso Tizapán, Ciudad de México, CDMX</p>
            </div>
            <div className='column has-text-right'>
              <p className='top-small'>
                <span><a href='#'>Aviso de privacidad</a></span>
                <a href='#'><span className='icon is-medium'>
                  <i className='fa fa-2x fa-facebook-square' />
                </span>
                </a>
                <a href='#'><span className='icon is-medium'>
                  <i className='fa fa-2x fa-linkedin-square' />
                </span>
                </a>
              </p>
              <p>Todos los derechos recervados, 2018</p>
            </div>
          </div>
        </div>
      </footer>
    )
  }
}

export default Footer
