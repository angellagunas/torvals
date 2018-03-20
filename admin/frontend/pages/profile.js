import React, { Component } from 'react'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'

import UpdateProfileForm from '~base/components/update-profile'
import UpdatePasswordForm from '~base/components/update-password'

export default Page({
  path: '/profile',
  exact: true,
  title: 'Profile',
  validate: loggedIn,
  component: class extends Component {
    render () {
      return (<div className='section'>
        <section className='is-fullwidth'>
          <div className='columns'>
            <div className='column is-half'>

              <div className='card'>
                <header className='card-header'>
                  <div className='card-header-title'>
                    <p className='margin-text'>Perfil</p>
                  </div>
                </header>
                <div className='card-content'>
                  <UpdateProfileForm />
                </div>
              </div>
            </div>
            <div className='column is-half'>
              <div className='card update-pass'>
                <header className='card-header'>
                  <div className='card-header-title'>
                    <p className='margin-text'>Cambiar contraseña</p>
                  </div>
                </header>
                <div className='card-content'>
                  <UpdatePasswordForm />
                </div>
              </div>
            </div>
          </div>
          <div className='columns'>

            <div className='column is-two-thirds'>
              <div className='card'>
                <header className='card-header'>
                  <p className='card-header-title'>
                    Data
                  </p>
                </header>
                <div className='card-content'>
                  <div className='content'>
                    No hay datos que mostrar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>)
    }
  }
})
