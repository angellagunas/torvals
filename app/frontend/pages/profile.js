import React, { Component } from 'react'
import tree from '~core/tree'

import UpdatePasswordForm from '~base/components/update-password'
import UpdateProfileForm from '~base/components/update-profile'
import SelectOrganizationForm from '~base/components/select-organization'

class Profile extends Component {
  getSelectOrganization () {
    let user = tree.get('user')
    if (user) {
      if (user.organizations.length > 1) {
        return (
          <div className='column is-one-third'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Cambiar organización
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <SelectOrganizationForm />
                </div>
              </div>
            </div>
          </div>
        )
      }
    }
  }

  render () {
    return (
      <section className='section'>
        <div className='columns is-multiline'>
          <div className='column is-one-third'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Perfil
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <UpdateProfileForm />
                </div>
              </div>
            </div>
          </div>
          {this.getSelectOrganization()}
          <div className='column is-one-third'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Contraseña
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <UpdatePasswordForm />
                </div>
              </div>
            </div>
          </div>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                    Data
                  </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                    Hola mundo
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}

export default Profile
