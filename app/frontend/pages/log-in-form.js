import React, { Component } from 'react'

import api from '~base/api'
import env from '~base/env-variables'
import Link from '~base/router/link'
import cookies from '~base/cookies'
import Loader from '~base/components/spinner'

import { BaseForm, PasswordWidget, EmailWidget } from '~components/base-form'

const schema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', title: 'Email' },
    password: { type: 'string', title: 'Contraseña' }
  }
}

const uiSchema = {
  password: { 'ui:widget': PasswordWidget },
  email: { 'ui:widget': EmailWidget }
}

class LogInButton extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: ' is-active',
      formData: {
        email: '',
        password: ''
      },
      apiCallErrorMessage: 'is-hidden'
    }
  }

  errorHandler (e) { }

  changeHandler ({ formData }) {
    this.setState({
      formData,
      apiCallErrorMessage: 'is-hidden',
      error: ''
    })
  }

  clearState () {
    this.setState({
      apiCallErrorMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  async submitHandler ({formData}) {
    this.setState({loading: true})

    var data
    try {
      data = await api.post('/user/login', formData)
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger',
        loading: false
      })
    }

    this.setState({loading: false})
    let user = data.user
    if (!user.organizations || user.organizations.length === 0) {
      return this.setState({
        error: '¡El usuario no tiene una organización asignada!',
        loading: false,
        apiCallErrorMessage: 'message is-danger',
        formData: {
          email: '',
          password: ''
        }
      })
    }

    if (user.organizations && user.organizations.length > 1) {
      this.setState({
        organizations: user.organizations,
        jwt: data.jwt,
        shouldSelectOrg: true
      })
    } else {
      const hostname = window.location.hostname
      const hostnameSplit = hostname.split('.')

      const organization = user.organizations[0].organization
      cookies.set('jwt', data.jwt)
      cookies.set('organization', organization.slug)

      if (env.ENV === 'production') {
        if (hostname.indexOf('stage') >= 0 || hostname.indexOf('staging') >= 0) {
          const newHostname = hostnameSplit.slice(-3).join('.')
          window.location = `//${organization.slug}.${newHostname}/dashboard`
        } else {
          const newHostname = hostnameSplit.slice(-2).join('.')
          window.location = `//${organization.slug}.${newHostname}/dashboard`
        }
      } else {
        const baseUrl = env.APP_HOST.split('://')
        window.location = baseUrl[0] + '://' + organization.slug + '.' + baseUrl[1] + '/dashboard'
      }
    }
  }

  selectOrgHandler (slug) {
    const hostname = window.location.hostname
    const hostnameSplit = hostname.split('.')
    cookies.set('jwt', this.state.jwt)

    if (env.ENV === 'production') {
      if (hostname.indexOf('stage') >= 0 || hostname.indexOf('staging') >= 0) {
        const newHostname = hostnameSplit.slice(-3).join('.')
        window.location = `//${slug}.${newHostname}/dashboard`
      } else {
        const newHostname = hostnameSplit.slice(-2).join('.')
        window.location = `//${slug}.${newHostname}/dashboard`
      }
    } else {
      const baseUrl = env.APP_HOST.split('://')
      window.location = baseUrl[0] + '://' + slug + '.' + baseUrl[1] + '/dashboard'
    }
  }

  getDropdown () {
    let listData = this.state.organizations.map(item => {
      return {
        id: item.organization.slug,
        key: item.organization.uuid,
        data: (
          <div className='columns is-fullwidth'>
            <div className='column is-one-third'>
              <img className='is-rounded' src={item.organization.profileUrl} width='45' height='45' alt='Avatar' />
            </div>
            <div className='column is-two-thirds'>
              <p>
                <strong>{item.organization.name}</strong>
                <br />
                <small>{item.organization.description}</small>
              </p>
            </div>
          </div>
        )
      }
    })

    return (
      <div className='navbar-item-height'>
        {listData.map((d, index) => {
          if (index < listData.length - 1) {
            return (
              <div key={d.key}>
                <a
                  className='navbar-item'
                  href='#'
                  onClick={e => { this.selectOrgHandler(d.id) }}
                  >
                  {d.data}
                </a>
                <hr className='navbar-divider' />
              </div>
            )
          } else {
            return (
              <div key={d.key}>
                <a
                  className='navbar-item'
                  href='#'
                  onClick={e => { this.selectOrgHandler(d.id) }}
                  >
                  {d.data}
                </a>
              </div>
            )
          }
        })}
      </div>
    )
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
    let spinner

    if (this.state.loading) {
      spinner = <Loader />
    }

    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    var resetLink
    if (env.EMAIL_SEND) {
      resetLink = (
        <p>
          <Link to='/password/forgotten/'>
            ¿Olvidó su contraseña?
          </Link>
        </p>
      )
    }

    if (this.state.shouldSelectOrg) {
      return (
        <div className='modal is-active'>
          <div className='modal-background' />
          <div className='modal-content'>
            <div className={'LogIn single-form ' + this.props.className}>
              <div className='card land-card'>
                <header className='card-header'>
                  <p className='card-header-title'>
                    Seleccione una organización
                  </p>
                </header>
                <div className='card-content'>
                  <div className='content'>
                    {spinner}
                    {this.getDropdown()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div>
        <a className='button is-info is-outlined' onClick={(e) => { this.showModal(e) }}>Log In</a>
        <div className={'modal' + this.state.className}>
          <div className='modal-background' onClick={(e) => {}} />
          <div className='modal-content land-login'>
            <section>
              <div className='card-image'>
                <figure className='image'>
                  <img src='/app/public/img/logo.png' />
                </figure>
              </div>
              <div className='card-container'>
                <h1 className='is-size-4 pad-bottom'>
                  Bienvenido a Orax
                </h1>
                <div className='content'>
                  <div className='columns is-centered'>
                    <div className='column is-10'>
                      <BaseForm schema={schema}
                        uiSchema={uiSchema}
                        formData={this.state.formData}
                        onChange={(e) => { this.changeHandler(e) }}
                        onSubmit={(e) => { this.submitHandler(e) }}
                        onError={(e) => { this.errorHandler(e) }}
                      >
                        <div className={this.state.apiCallErrorMessage}>
                          <div className='message-body is-size-7 has-text-centered'>
                            {error}
                          </div>
                        </div>
                        <div>
                          <button
                            className='button is-info is-fullwidth'
                            type='submit'
                            disabled={!!error}
                          >
                            Iniciar sesión
                      </button>
                        </div>
                      </BaseForm>
                    </div>
                  </div>
                  {resetLink}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  }
}
export default LogInButton