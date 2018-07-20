import React, { Component } from 'react'
import Checkbox from '~base/components/base-checkbox'

class RegisterModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      step: 0,
      fade: 'fadeInRight'
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

  getForm () {
    if (this.state.step === 0) {
      return this.mailForm()
    } else if (this.state.step === 1) {
      return this.userForm()
    } else if (this.state.step === 2) {
      return this.siteForm()
    } else {
      return this.orgForm()
    }
  }

  nextStep (step) {
    if (step < 0) {
      step = 0
      this.hideModal()
    }
    if (step > this.state.step) {
      this.setState({
        fade: 'fadeOutLeft'
      }, () => {
        setTimeout(() => {
          this.setState({
            fade: 'fadeInRight',
            step: step
          })
        }, 300)
      })
    } else {
      this.setState({
        fade: 'fadeOutRight'
      }, () => {
        setTimeout(() => {
          this.setState({
            fade: 'fadeInLeft',
            step: step
          })
        }, 300)
      })
    }
  }

  mailForm () {
    return (
      <div className={'register__form ' + this.state.fade}>
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
            <div className='column'>
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
                    this.setState({ accept: true })
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  userForm () {
    return (
      <div className={'register__form ' + this.state.fade}>
        <h1 className='is-size-3'>
          <span className='icon is-large'>
            <i className='fa fa-3x fa-user' />
          </span>
        </h1>
        <h1 className='is-size-2'>
          Datos personales
        </h1>
        <p className='is-size-5 pad-bottom'>Completa tu registro para crear tu perfil.</p>
        <br />
        <br />
        <div className='content'>
          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Nombre *</label>
                <div className='control'>
                  <input className='input' type='text' placeholder='correo@correo.com' required autoComplete='off' />
                </div>
              </div>
              <div className='field'>
                <label className='label'>Puesto</label>
                <div className='control'>
                  <input className='input' type='text' placeholder='correo@correo.com' required autoComplete='off' />
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>Apellido *</label>
                <div className='control'>
                  <input className='input' type='text' placeholder='Deberá tener al menos 6 caracteres' autoComplete='off' required />
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
        </div>
      </div>
    )
  }

  siteForm () {
    return (
      <div className={'register__form ' + this.state.fade}>
        <h1 className='is-size-3'>
          <span className='icon is-large'>
            <i className='fa fa-3x fa-fort-awesome' />
          </span>
        </h1>
        <h1 className='is-size-2'>
          Identifica tu sitio
        </h1>
        <p className='is-size-5 pad-bottom'>Ingresa un subdominio que identifique a tu empresa, recuerda que debe ser fácil de recordar.</p>
        <div className='content'>
          <br />
          <br />
          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>El subdominio que ingreses será la URL a tu espacio de trabajo</label>
                <div className='control'>
                  <div class='field has-addons'>
                    <p class='control  is-expanded'>
                      <input className='input' type='text' placeholder='Your email' />
                    </p>
                    <p className='control'>
                      <a className='button is-static'>
                        .orax.io
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  orgForm () {
    return (
      <div className={'register__form ' + this.state.fade}>
        <h1 className='is-size-3'>
          <span className='icon is-large'>
            <i className='fa fa-3x fa-building-o' />
          </span>
        </h1>
        <h1 className='is-size-2'>
            Cuéntanos de tu empresa
        </h1>
        <p className='is-size-5 pad-bottom'>Completa información de tu empresa y datos de facturación.</p>

        <div className='content'>
          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Nombre</label>
                <div className='control'>
                  <input className='input' type='text' placeholder='Ingresa el nombre completo de tu empresa' required autoComplete='off' />
                </div>
              </div>
            </div>
          </div>

          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Giro</label>
                <div className='control'>
                  <input className='input' type='text' placeholder='Ingresa el nombre completo de tu empresa' required autoComplete='off' />
                </div>
              </div>
              <div className='field'>
                <label className='label'>País</label>
                <div className='control'>
                  <input className='input' type='text' placeholder='correo@correo.com' required autoComplete='off' />
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>No. de empleados</label>
                <div className='control'>
                  <input className='input' type='text' placeholder='Deberá tener al menos 6 caracteres' autoComplete='off' required />
                </div>
              </div>
            </div>
          </div>

          <hr />

          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>RFC</label>
                <div className='control'>
                  <input className='input' type='text' placeholder='Ingresa el nombre completo de tu empresa' required autoComplete='off' />
                </div>
              </div>
            </div>
          </div>

          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Razón Social</label>
                <div className='control'>
                  <input className='input' type='text' placeholder='Ingresa el nombre completo de tu empresa' required autoComplete='off' />
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>Correo de facturación</label>
                <div className='control'>
                  <input className='input' type='text' placeholder='Deberá tener al menos 6 caracteres' autoComplete='off' required />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  indicators () {
    let indicators = []
    for (let i = 0; i < 4; i++) {
      if (i === this.state.step) {
        indicators.push(<span className='indicator indicator__active' />)
      } else {
        indicators.push(<span className='indicator' />)
      }
    }
    return (
      <div className='step-indicators'>
        {indicators}
      </div>
    )
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
              <section className='register_section'>
                {this.getForm()}
              </section>
              <center>
                <br />
                <br />
                <div className='field'>
                  <button className='button is-primary is-inverted is-medium'
                    onClick={() => { this.nextStep(this.state.step - 1) }}>
                    Regresar
              </button>
                  <button className='button is-primary is-medium'
                    onClick={() => { this.nextStep(this.state.step + 1) }}>
                    Siguiente
              </button>
                </div>
                {this.indicators()}
              </center>
            </div>

            <button className='modal-close is-large has-text-dark' aria-label='close' onClick={() => { this.hideModal() }} />
          </div>
        </div>
      </div>
    )
  }
}

export default RegisterModal
