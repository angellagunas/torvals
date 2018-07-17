import React, { Component } from 'react'
import Page from '~base/page'
import Link from '~base/router/link'
import { forcePublic } from '~base/middlewares/'
import LogInButton from './log-in-form'

class LandPage extends Component {
  render () {
    return (
      <div>
        <nav className='navbar is-primary is-fixed-top changeBack'>
          <div className='container'>
            <div className='navbar-brand'>
              <Link to='/landing' className='navbar-item'>
                <img src='/app/public/img/logow.png' width='112px' />
              </Link>
            </div>
            <div className='navbar-menu is-active'>
              <div className='navbar-start' />
              <div className='navbar-end'>
                <div className='navbar-item'>
                  <LogInButton />
                </div>
              </div>
            </div>
          </div>
        </nav>
        <section className='hero is-medium is-primary changeBack'>
          <div className='hero-body'>
            <div className='container'>
              <div className='columns'>
                <div className='column pos-rel'>
                  <h1 className='title'>
                    Large title
                  </h1>
                  <h2 className='subtitle'>
                    Large subtitle
                  </h2>
                  <img className='landing-right-img' src='/app/public/img/dash.jpg' />

                </div>
              </div>

            </div>
          </div>
        </section>

        <section className='hero is-medium is-bg-whitesmoke'>
          <div className='hero-body'>
            <div className='container'>
              <div className='columns'>
                <div className='column is-6'>
                  <h1 className='title'>
                    Large title
                  </h1>
                  <h2 className='subtitle'>
                    Large subtitle
                  </h2>
                </div>
                <div className='column'>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className='hero is-medium is-primary changeBack'>
          <div className='hero-body'>
            <div className='container has-text-centered'>
              <div className='has-text-centered'>
                <p>
                  <img src='/app/public/img/woman.png' width='200px' />
                </p>
                <h1 className='title is-size-5'>
                  Lorem ipsum dolor sit amet,Lorem ipsum dolor sit amet,
                  </h1>
              </div>
            </div>
          </div>
        </section>

        <section className='hero is-medium is-bg-whitesmoke'>
          <div className='hero-body'>
            <div className='container'>
              <div className='columns'>
                <div className='column is-6'>
                  <h1 className='title'>
                    ¿Necesitas más información?
                  </h1>
                  <h2 className='subtitle'>
                    Orax te da la libertad de seleccionar la forma en le das forma a tus datos
                  </h2>
                </div>
                <div className='column is-offset-1'>
                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Nombre</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='Text input' />
                        </div>
                        <p className='help'>This is a help text</p>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Apellido</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='Text input' />
                        </div>
                        <p className='help'>This is a help text</p>
                      </div>
                    </div>
                  </div>

                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Empresa u Organización</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='Text input' />
                        </div>
                        <p className='help'>This is a help text</p>
                      </div>
                    </div>
                  </div>

                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Número de empleados</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='Text input' />
                        </div>
                        <p className='help'>This is a help text</p>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>País</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='Text input' />
                        </div>
                        <p className='help'>This is a help text</p>
                      </div>
                    </div>
                  </div>

                  <button className='button is-primary is-pulled-right'>
                  Enviar
                  </button>

                </div>
              </div>
            </div>
          </div>

        </section>

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
