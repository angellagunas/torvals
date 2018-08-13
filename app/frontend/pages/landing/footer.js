import React, { Component } from 'react'

class Footer extends Component {
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
              <p className='top-medium'>Orax powered by Common Sense People</p>
              <p>Donato Guerra 9, Progreso Tizapán, Ciudad de México, CDMX</p>
            </div>
            <div className='column has-text-right'>
              <p className='top-small'>
                <span><a href='/privacy' target='_self'>Aviso de privacidad</a></span>
                {/* <a href='#'><span className='icon is-medium'>
                  <i className='fa fa-2x fa-facebook-square' />
                </span>
                </a>
                <a href='#'><span className='icon is-medium'>
                  <i className='fa fa-2x fa-linkedin-square' />
                </span>
                </a> */}
              </p>
              <p>Todos los derechos reservados, 2018</p>
            </div>
          </div>
        </div>
      </footer>
    )
  }
}

export default Footer
