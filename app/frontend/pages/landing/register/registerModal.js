import React, { Component } from 'react'
import Checkbox from '~base/components/base-checkbox'

class RegisterModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: ''
    }
  }
  showModal () {
    this.setState({
      className: ' is-active'
    })
  }

  hideModal () {
    this.setState({
      className: ''
    })
  }
  render () {
    return (
      <div>
        <div>
          <a className={this.props.buttonClass ? 'button is-success ' + this.props.buttonClass : 'button is-success'}
            onClick={(e) => { this.showModal(e) }}>
            Probar 30 días gratis
          </a>
          <div className={'modal register__modal' + this.state.className}>
            <div className='modal-background' />
            <div className='modal-content'>
              <section>
                <div className='card-container'>
                  <h1 className='is-size-3'>
                    <span className='icon is-large'>
                      <i className='fa fa-3x fa-cubes' />
                    </span>
                  </h1>
                  <h1 className='is-size-2'>
                    Bienvenido a Orax
                  </h1>
                  <p className='is-size-5 pad-bottom'>Ingresa tus datos. Tu usuario será el administrador de la cuenta y utilizarás tu correo y contraseña para acceder a Orax.</p>
                  <div className='content'>
                    <div className='columns is-centered'>
                      <div className='column is-7'>
                        <div className='field'>
                          <label className='label'>Email</label>
                          <div className='control'>
                            <input className='input' type='email' placeholder='correo@correo.com' required autoComplete='off' />
                          </div>
                        </div>
                        <div className='field'>
                          <label className='label'>Contraseña</label>
                          <div className='control'>
                            <input className='input' type='password' placeholder='Deberá tener al menos 6 caracteres' autoComplete='off' required />
                          </div>
                        </div>
                        <div className='field'>
                          <Checkbox
                            label={
                              <strong>Acepto el <a className='has-text-primary'>Aviso de privacidad</a> y condición de uso de mis datos.</strong>
                            }
                            handleCheckboxChange={(e, value) => {
                              this.setState({ accept: true})
                            }}
                          />
                        </div>
                        <br />
                        <br />
                        <br />
                        <div className='field'>
                          <button className='button is-primary is-pulled-right is-medium'>
                            Siguiente
                        </button>
                          <button className='button is-primary is-inverted is-pulled-right is-medium'
                            onClick={() => { this.hideModal() }}>
                            Regresar
                        </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className='card-container'>
                  <h1 className='is-size-3'>
                    <span className='icon is-large'>
                      <i className='fa fa-3x fa-user' />
                    </span>
                  </h1>
                  <h1 className='is-size-2'>
                    Datos personales
                  </h1>
                  <p className='is-size-5 pad-bottom'>Completa tu registro para crear tu perfil.</p>
                  <div className='content'>
                    <div className='columns is-centered'>
                      <div className='column is-5'>
                        <div className='field'>
                          <label className='label'>Nombre *</label>
                          <div className='control'>
                            <input className='input' type='text' placeholder='correo@correo.com' required autoComplete='off' />
                          </div>
                        </div>
                        <div className='field'>
                          <label className='label'>Apellido *</label>
                          <div className='control'>
                            <input className='input' type='text' placeholder='Deberá tener al menos 6 caracteres' autoComplete='off' required />
                          </div>
                        </div>
                      </div>

                      <div className='column is-5'>
                        <div className='field'>
                          <label className='label'>Puesto</label>
                          <div className='control'>
                            <input className='input' type='text' placeholder='correo@correo.com' required autoComplete='off' />
                          </div>
                        </div>
                        <div className='field'>
                          <label className='label'>Teléfono</label>
                          <div className='control'>
                            <input className='input' type='tel' placeholder='Deberá tener al menos 6 caracteres' autoComplete='off' required />
                          </div>
                        </div>
                      </div>

                    </div>
                    <br />
                    <br />
                    <br />
                    <div className='field'>
                      <button className='button is-primary is-pulled-right is-medium'>
                        Siguiente
                        </button>
                      <button className='button is-primary is-inverted is-pulled-right is-medium'
                        onClick={() => { this.hideModal() }}>
                        Regresar
                        </button>
                    </div>
                  </div>

                </div>
              </section>
            </div>
            <button className='modal-close is-large has-text-dark' aria-label='close' onClick={() => { this.hideModal() }} />
          </div>
        </div>
      </div>
    )
  }
}

export default RegisterModal
