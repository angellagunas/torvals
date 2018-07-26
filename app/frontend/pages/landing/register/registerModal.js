import React, { Component } from 'react'
import Checkbox from '~base/components/base-checkbox'
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector'
import api from '~base/api'
import tree from '~core/tree'
import env from '~base/env-variables'
import cookies from '~base/cookies'

class RegisterModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      step: 0,
      fade: 'fadeInRight',
      accept: false,
      registerData: {
        email: '',
        pass: '',
        passConfirm: '',
        name: '',
        lastName: '',
        job: '',
        phone: '',
        domain: '',
        orgName: '',
        turn: '',
        employees: '',
        country: '',
        region: '',
        rfc: '',
        razonSocial: '',
        orgEmail: ''
      },
      errors: {
        error: false,
        email: '',
        pass: '',
        passConfirm: '',
        name: '',
        lastName: '',
        job: '',
        phone: '',
        domain: '',
        orgName: '',
        turn: '',
        employees: '',
        country: '',
        region: '',
        rfc: '',
        razonSocial: '',
        orgEmail: ''
      }
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
    } else if (this.state.step === 3) {
      return this.orgForm()
    } else {
      return this.finish()
    }
  }

  async nextStep (step) {
    if (step < 0) {
      step = 0
      this.hideModal()
    }
    if (step > this.state.step) {
      let res = await this.sendData(step)
      if (!res) {
        return
      }
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

  async sendData (step) {
    if (step === 1) {
      return this.validEmail()
    } else if (step === 2) {
      return this.createUser()
    } else if (step === 3) {
      return this.validateDomain()
    } else if (step === 4) {
      return this.updateOrg()
    }
  }

  async validEmail () {
    try {
      let url = '/user/validate'
      let res = await api.post(url, {email: this.state.registerData.email})
      if (res.status === 400) {
        this.setState({
          errors: {
            ...this.state.errors,
            error: true,
            email: 'Ese correo ya se encuentra en uso'
          }
        })
        return false
      }
      this.setState({
        errors: {
          ...this.state.errors,
          error: false,
          email: ''
        }
      })
      return true
    } catch (e) {
      console.log(e)
      this.setState({
        errors: {
          ...this.state.errors,
          error: true,
          email: 'Ese correo ya se encuentra en uso'
        }
      })
      return false
    }
  }

  async createUser () {
    try {
      let url = '/user'
      let res = await api.post(url,
        { email: this.state.registerData.email,
          password: this.state.registerData.pass,
          name: this.state.registerData.name + ' ' + this.state.registerData.lastName,
          job: this.state.registerData.job,
          phone: this.state.registerData.phone
        })
      if (res.status === 401) {
        this.setState({
          errors: {
            ...this.state.errors,
            error: true,
            email: 'Ese correo ya se encuentra en uso'
          }
        })
        return false
      }
      this.setState({
        errors: {
          ...this.state.errors,
          error: false,
          email: ''
        },
        user: res.user,
        jwt: res.jwt
      })

      return true
    } catch (e) {
      console.log(e)
      this.setState({
        errors: {
          ...this.state.errors,
          error: true,
          email: 'Ese correo ya se encuentra en uso'
        }
      })
      return false
    }
  }

  async validateDomain () {
    try {
      let url = '/organization/validate'
      let res = await api.post(url,
        {
          slug: this.state.registerData.domain,
          user: this.state.user.uuid
        })
      if (res.status === 400) {
        this.setState({
          errors: {
            ...this.state.errors,
            error: true,
            domain: 'Ese subdominio ya se encuentra en uso'
          }
        })
        return false
      }
      this.setState({
        errors: {
          ...this.state.errors,
          error: false,
          domain: ''
        },
        org: res.data,
        user: res.user
      })

      return true
    } catch (e) {
      console.log(e)
      this.setState({
        errors: {
          ...this.state.errors,
          error: true,
          domain: 'Ese subdominio ya se encuentra en uso'
        }
      })
      return false
    }
  }

  async updateOrg () {
    let r = this.state.registerData

    try {
      let url = '/organization/update/' + this.state.org.uuid
      let res = await api.post(url,
        {
          name: r.orgName,
          country: r.country + ' ' + r.region,
          status: 'trial',
          employees: r.employees,
          rfc: r.rfc,
          billingEmail: r.orgEmail,
          businessName: r.orgName,
          salesRep: {
            name: r.name,
            email: r.email,
            phone: r.phone
          }
        })
      if (res.status === 400) {
        this.setState({
          errors: {
            ...this.state.errors,
            error: true,
            domain: 'Ese subdominio ya se encuentra en uso'
          }
        })
        return false
      }

      let org = { ...this.state.org, ...res.data }

      this.setState({
        errors: {
          ...this.state.errors,
          error: false,
          domain: ''
        },
        org: org,
        rules: res.rule
      })

      cookies.set('jwt', this.state.jwt)
      cookies.set('organization', org)

      return true
    } catch (e) {
      console.log(e)
      this.setState({
        errors: {
          ...this.state.errors,
          error: true,
          domain: 'Ese subdominio ya se encuentra en uso'
        }
      })
      return false
    }
  }

  handleInputChange (e, input) {
    this.validateInput(e, input)
    let aux = this.state.registerData
    let val = ''

    if (input === 'country' || input === 'region') {
      val = e
    } else if (input === 'phone' || input === 'employees') {
      if (!isNaN(Number(e.target.value))) {
        val = e.target.value
      }
    } else {
      val = e.target.value
    }

    aux[input] = val
    this.setState({
      registerData: aux
    })
  }

  validateInput (e, input) {
    let aux = this.state.errors

    if (input === 'email' || input === 'orgEmail') {
      if (!e.target.validity.valid) {
        aux.error = true
        aux[input] = 'Ingresa una dirección de correo válida'
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'pass') {
      if (!e.target.validity.valid) {
        aux.error = true
        aux[input] = 'La contraseña debe contener al menos seis caracteres, incluidas mayúsculas, minúsculas y números'
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'passConfirm') {
      if (!e.target.validity.valid || this.state.registerData.pass !== e.target.value) {
        aux[input] = 'Las contraseñas no coinciden'
        aux.error = true
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'domain') {
      if (!e.target.validity.valid) {
        aux[input] = 'El subdominio solo puede contener letras, números y _'
        aux.error = true
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'orgName') {
      if (e.target.value === undefined || e.target.value === '') {
        aux[input] = 'Falta el nombre de tu empresa'
        aux.error = true
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'rfc') {
      if (!e.target.validity.valid) {
        aux[input] = 'Ingrese un RFC válido'
        aux.error = true
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    this.setState({
      errors: aux
    })
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
        <p className='is-size-5 pad-bottom'>
         Ingresa tus datos como administrador de la cuenta para acceder y utilizar Orax.
        </p>
        <div className='content'>
          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Correo</label>
                <div className='control'>
                  <input
                    className='input'
                    type='email'
                    placeholder='correo@correo.com'
                    required
                    autoComplete='off'
                    name='email'
                    pattern='[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$'
                    value={this.state.registerData.email}
                    onChange={(e) => this.handleInputChange(e, 'email')} />
                </div>
                <p className='help is-danger'>{this.state.errors.email}</p>
              </div>
              <div className='field'>
                <label className='label'>Contraseña</label>
                <div className='control'>
                  <input
                    pattern='^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.]).{8,}$'
                    className='input'
                    type='password'
                    placeholder='Deberá contener al menos 8 caracteres, incluidas mayúsculas, minúsculas, números y caracteres espeaciales como #?!@$%^&*-.'
                    autoComplete='off'
                    required
                    name='pass'
                    value={this.state.registerData.pass}
                    onChange={(e) => this.handleInputChange(e, 'pass')} />
                </div>
                <p className='help is-danger'>{this.state.errors.pass}</p>
              </div>
              <div className='field'>
                <label className='label'>Confirmar contraseña</label>
                <div className='control'>
                  <input
                    pattern='^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.]).{8,}$'
                    className='input'
                    type='password'
                    placeholder='Confirmar contraseña'
                    autoComplete='off'
                    required
                    name='passConfirm'
                    value={this.state.registerData.passConfirm}
                    onChange={(e) => this.handleInputChange(e, 'passConfirm')} />
                </div>
                <p className='help is-danger'>{this.state.errors.passConfirm}</p>
              </div>
              <div className='field'>
                <div className='columns'>
                  <div className='column is-narrow'>
                    <Checkbox
                      hideLabel
                      checked={this.state.accept}
                      handleCheckboxChange={(e, value) => {
                        this.setState({ accept: value })
                      }}
                    />
                  </div>
                  <div className='column is-narrow'>
                    <div className='accept__label'>
                      <strong>Acepto el <a className='has-text-primary'>Aviso de privacidad</a> y condición de uso de mis datos.</strong>
                    </div>
                  </div>
                </div>

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
                  <input
                    className='input'
                    type='text'
                    placeholder='Nombre(s)'
                    autoComplete='off'
                    required
                    name='name'
                    value={this.state.registerData.name}
                    onChange={(e) => this.handleInputChange(e, 'name')} />
                </div>
                <p className='help is-danger'>{this.state.errors.name}</p>
              </div>
              <div className='field'>
                <label className='label'>Puesto</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder='Ej. Administrador'
                    autoComplete='off'
                    name='job'
                    value={this.state.registerData.job}
                    onChange={(e) => this.handleInputChange(e, 'job')} />
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>Apellido *</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder='Apellido(s)'
                    autoComplete='off'
                    required
                    name='lastName'
                    value={this.state.registerData.lastName}
                    onChange={(e) => this.handleInputChange(e, 'lastName')} />
                </div>
                <p className='help is-danger'>{this.state.errors.lastName}</p>
              </div>
              <div className='field'>
                <label className='label'>Teléfono</label>
                <div className='control'>
                  <input
                    className='input'
                    type='tel'
                    placeholder='Lada + 10 digitos'
                    autoComplete='off'
                    required
                    name='phone'
                    pattern='[0-9]{10}'
                    value={this.state.registerData.phone}
                    onChange={(e) => this.handleInputChange(e, 'phone')} />
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
                  <div className='field has-addons'>
                    <p className='control  is-expanded'>
                      <input
                        className='input'
                        type='text'
                        placeholder='url-de-tu-espacio'
                        autoComplete='off'
                        required
                        name='domain'
                        pattern='[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?'
                        value={this.state.registerData.domain}
                        onChange={(e) => this.handleInputChange(e, 'domain')} />
                    </p>
                    <p className='control'>
                      <a className='button is-static'>
                        .orax.io
                      </a>
                    </p>
                  </div>
                </div>
                <p className='help is-danger'>{this.state.errors.domain}</p>
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
                <label className='label'>Nombre *</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder='Ingresa el nombre completo de tu empresa'
                    autoComplete='off'
                    required
                    name='orgName'
                    value={this.state.registerData.orgName}
                    onChange={(e) => this.handleInputChange(e, 'orgName')} />
                </div>
                <p className='help is-danger'>{this.state.errors.orgName}</p>
              </div>
            </div>
          </div>

          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Giro</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder='Ingresa el giro de tu empresa'
                    autoComplete='off'
                    required
                    name='turn'
                    value={this.state.registerData.turn}
                    onChange={(e) => this.handleInputChange(e, 'turn')} />
                </div>
              </div>
              <div className='field'>
                <label className='label'>País</label>
                <div className='control'>
                  <CountryDropdown
                    defaultOptionLabel='Selecciona tu país'
                    value={this.state.registerData.country}
                    id='my-country-field-id'
                    name='my-country-field'
                    classes='input'
                    onChange={(e) => { this.handleInputChange(e, 'country') }} />
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>No. de empleados</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder='No. de empleados de tu empresa'
                    autoComplete='off'
                    required
                    name='employees'
                    value={this.state.registerData.employees}
                    onChange={(e) => this.handleInputChange(e, 'employees')} />
                </div>
              </div>
              <div className='field'>
                <label className='label'>Región</label>
                <div className='control'>
                  <RegionDropdown
                    blankOptionLabel='No hay paìs seleccionado'
                    defaultOptionLabel='Selecciona tu región'
                    country={this.state.registerData.country}
                    value={this.state.registerData.region}
                    name='my-region-field-name'
                    id='my-region-field-id'
                    classes='input'
                    onChange={(e) => { this.handleInputChange(e, 'region') }} />
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
                  <input
                    className='input'
                    type='text'
                    placeholder='Ingresa el giro de tu empresa'
                    autoComplete='off'
                    name='rfc'
                    pattern='[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]'
                    value={this.state.registerData.rfc}
                    onChange={(e) => this.handleInputChange(e, 'rfc')} />
                </div>
                <p className='help is-danger'>{this.state.errors.rfc}</p>
              </div>
            </div>
          </div>

          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Razón Social</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder='Ingresa la razón social giro de tu empresa'
                    autoComplete='off'
                    name='razonSocial'
                    value={this.state.registerData.razonSocial}
                    onChange={(e) => this.handleInputChange(e, 'razonSocial')} />
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>Correo de facturación</label>
                <div className='control'>
                  <input
                    className='input'
                    type='email'
                    placeholder='Ingresa el correo de tu empresa'
                    autoComplete='off'
                    name='orgEmail'
                    value={this.state.registerData.orgEmail}
                    onChange={(e) => this.handleInputChange(e, 'orgEmail')} />
                </div>
                <p className='help is-danger'>{this.state.errors.orgEmail}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  finish () {
    return (
      <div className={'register__form ' + this.state.fade}>
        <h1 className='is-size-3'>
          <span className='icon is-large'>
            <i className='fa fa-3x fa-birthday-cake' />
          </span>
        </h1>
        <h1 className='is-size-2 pad-bottom'>
          ¡Felicidades!
        </h1>
        <div className='content'>
          <p className='is-size-5'>
           Tu cuenta ha sido creada. <strong>Tus 30 días de prueba comienzan hoy. </strong>
           Solicita tu cotización en cualquier momento desde el apartado "Mi Cuenta" y sigue utilizando Orax.
           </p>

        </div>
      </div>
    )
  }

  indicators () {
    let indicators = []
    for (let i = 0; i < 4; i++) {
      if (i === this.state.step) {
        indicators.push(<span key={i} className='indicator indicator__active' />)
      } else {
        indicators.push(<span key={i} className='indicator' />)
      }
    }
    return (
      <div className='step-indicators'>
        {indicators}
      </div>
    )
  }

  continue () {
    let r = this.state.registerData
    let e = this.state.errors
    if (e.error) {
      return false
    }
    if (this.state.step === 0) {
      if (r.email === '' || e.email !== '') {
        return false
      }
      if (r.pass === '' || e.pass !== '') {
        return false
      }
      if (r.passConfirm === '' || e.passConfirm !== '') {
        return false
      }
      if (!this.state.accept) {
        return false
      }
    } else if (this.state.step === 1) {
      if (r.name === '' || e.name !== '') {
        return false
      }
      if (r.lastName === '' || e.lastName !== '') {
        return false
      }
    } else if (this.state.step === 2) {
      if (r.domain === '' || e.domain !== '') {
        return false
      }
    } else if (this.state.step === 3) {
      if (r.orgName === '') {
        return false
      }
    }

    return true
  }

  finishUp () {
    const hostname = window.location.hostname
    const hostnameSplit = hostname.split('.')
    tree.set('loggedIn', true)
    tree.commit()
    if (env.ENV === 'production') {
      if (hostname.indexOf('stage') >= 0 || hostname.indexOf('staging') >= 0) {
        const newHostname = hostnameSplit.slice(-3).join('.')
        window.location = `//${this.state.org.slug}.${newHostname}/rules`
      } else {
        const newHostname = hostnameSplit.slice(-2).join('.')
        window.location = `//${this.state.org.slug}.${newHostname}/rules`
      }
    } else {
      const baseUrl = env.APP_HOST.split('://')
      window.location = baseUrl[0] + '://' + this.state.org.slug + '.' + baseUrl[1] + '/rules'
    }
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
                {this.state.step !== 4 &&
                <div>
                  <div className='field'>
                    <button className='button is-primary is-inverted is-medium'
                      onClick={() => { this.nextStep(this.state.step - 1) }}>
                    Regresar
                  </button>
                    <button className='button is-primary is-medium'
                      disabled={!this.continue()}
                      onClick={() => { this.nextStep(this.state.step + 1) }}>
                    Siguiente
                    </button>
                  </div>
                  {this.indicators()}
                </div>
                }
                {this.state.step === 4 &&
                  <div>
                    <div className='field'>
                      <button className='button is-primary is-medium'
                        disabled={!this.continue()}
                        onClick={() => { this.finishUp() }}>
                        Empezar
                    </button>
                    </div>
                  </div>
                }
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
