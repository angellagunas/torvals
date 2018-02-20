import React, { Component } from 'react'
import Page from '~base/page'
import Link from '~base/router/link'
import { forcePublic } from '~base/middlewares/'
import LogInButton from './log-in-form'

class LandPage extends Component {
  render () {
    return (
      <div className='is-wrapper'>
        <div className='is-flex c-flex-1 columns is-gapless'>
          <div className='column is-3 land-side has-text-centered'>
            <div className='down'>
              <figure className='image'>
                <img src='/admin/public/img/abraxas-logo.svg' alt='abraxas logo' />
              </figure>
              <br />
              <h2 className='has-text-white is-size-4-desktop is-size-5-touch'>Nuestra misión es dar cognición sistemática a las organizaciones</h2>
            </div>
          </div>
          <div className='column is-flex is-flex-column main-wrapper'>

            <section className='hero is-medium c-flex-1 is-flex is-bg-whitesmoke'>
              <div className='hero-head is-bg-white'>
                <nav className='navbar is-bg-white'>
                  <div className='navbar-brand'>
                    <Link to='/landing' className='navbar-item grey-hover'>
                      <img className='is-flex r-pad' src='/admin/public/img/pythia-logo.png' />
                      <h3 className='is-size-4 is-capitalized has-text-weight-semibold'>Pythia</h3>
                    </Link>
                  </div>
                  <div className='navbar-menu is-active'>
                    <div className='navbar-start' />
                    <div className='navbar-end'>
                      <div className='navbar-item'>
                        <LogInButton history={this.props.history} />
                      </div>
                    </div>
                  </div>
                </nav>
              </div>

              <div className='hero-body'>
                <div className='has-text-centered'>
                  <h1 className='title has-text-color is-size-3-touch is-size-2-desktop pad-bottom'>
                    Toma de decisiones de operación <br />
                    a partir de predicción de comportamiento de venta
                    </h1>
                  <div className='land-content'>
                    <div className='columns'>

                      <div className='column'>
                        <div className='card card-land'>
                          <div className='card-image'>
                            <span className='icon icon-land has-text-white'>
                              <i className='fa fa-2x fa-line-chart' />
                            </span>
                          </div>
                          <div className='card-content'>
                            <div className='content'>
                              <p className='has-text-danger is-size-5 has-text-weight-semibold is-padding-bottom-small'>Predicción</p>
                              Predice el futuro de ventas o producción.
                              </div>
                          </div>
                        </div>
                      </div>

                      <div className='column'>
                        <div className='card card-land'>
                          <div className='card-image'>
                            <span className='icon icon-land has-text-white'>
                              <i className='fa fa-2x fa-adjust' />
                            </span>
                          </div>
                          <div className='card-content'>
                            <div className='content'>
                              <p className='has-text-danger is-size-5 has-text-weight-semibold is-padding-bottom-small'>Ajuste</p>
                              Ajusta la orden de acuerdo a la predicción y existencias.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className='column'>
                        <div className='card card-land'>
                          <div className='card-image'>
                            <span className='icon icon-land has-text-white'>
                              <i className='fa fa-2x fa-lock' />
                            </span>
                          </div>
                          <div className='card-content'>
                            <div className='content'>
                              <p className='has-text-danger is-size-5 has-text-weight-semibold is-padding-bottom-small'>Confirmación</p>
                              Confirma con seguridad tus órdenes o pedidos.
                              </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/landing',
  exact: true,
  validate: forcePublic,
  component: LandPage
})
