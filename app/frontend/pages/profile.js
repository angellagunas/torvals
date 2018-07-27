import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import tree from '~core/tree'

import UpdatePasswordForm from '~base/components/update-password'
import UpdateProfileForm from '~base/components/update-profile'
import TokensList from '~base/components/token-list'
import Breadcrumb from '~base/components/base-breadcrumb'

class Profile extends Component {
  render () {
    const currentUser = tree.get('user')
    return (
      <div className='detail-page'>
        <div className='section-header'>
          <h2>{currentUser.name} | {currentUser.currentRole.name}</h2>
        </div>
        <div className='level'>
          <div className='level-left'>
            <div className='level-item'>
              <Breadcrumb
                path={[
                  {
                    path: '/',
                    label: 'Inicio', //TODO: translate
                    current: false
                  },
                  {
                    path: '/profile',
                    label: 'Mi perfil', //TODO: translate
                    current: true
                  },
                  {
                    path: '/profile',
                    label: currentUser.name,
                    current: true
                  }
                ]}
                align='left'
              />
            </div>
          </div>
        </div>
        <section className='section is-paddingless-top pad-sides'>
          <div className='columns is-multiline'>
            <div className='column is-half'>
              <div className='card'>
                <header className='card-header'>
                  <div className='card-header-title'>

                    <FormattedMessage
                      id="profile.form1Title"
                      defaultMessage={`Detalles`}
                    />

                  </div>
                </header>
                <div className='card-content'>
                  <div className='content'>
                    <UpdateProfileForm />
                  </div>
                </div>
              </div>
            </div>
            <div className='column is-half'>
              <div className='card update-pass'>
                <header className='card-header'>
                  <div className='card-header-title'>

                    <FormattedMessage
                      id="profile.form2Title"
                      defaultMessage={`Cambiar contraseña`}
                    />

                  </div>
                </header>
                <div className='card-content'>
                  <div className='content'>
                    <UpdatePasswordForm />
                  </div>
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
  path: '/profile',
  title: 'Profile', //TODO: translate
  exact: true,
  validate: loggedIn,
  component: Profile
})
