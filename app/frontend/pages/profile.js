import React, { Component } from 'react'
import UpdatePasswordForm from '~base/components/update-password'
import UpdateProfileForm from '~base/components/update-profile'
import SelectOrganizationForm from '~base/components/select-organization'

class Profile extends Component {
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
