import React, { Component } from 'react'

import api from '~base/api'
import env from '~base/env-variables'
import tree from '~core/tree'
import Link from '~base/router/link'

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

  async submitHandler ({ formData }) {
    var data
    try {
      data = await api.post('/user/login', formData)
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }

    if (data.isAdmin) {
      window.localStorage.setItem('jwt', data.jwt)
      tree.set('jwt', data.jwt)
      tree.set('user', data.user)
      tree.set('loggedIn', true)
      tree.commit()

      this.props.history.push(env.PREFIX + '/dashboard', {})
    } else {
      this.setState({
        error: 'Invalid user',
        apiCallErrorMessage: 'message is-danger',
        formData: {
          email: '',
          password: ''
        }
      })
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

    return (
      <div>
        <a className='button is-info is-outlined' onClick={(e) => { this.showModal(e) }}>Log In</a>
        <div className={'modal' + this.state.className}>
          <div className='modal-background' />
          <div className='modal-content land-login'>
            <section>
              <div className='card-image'>
                <figure className='image'>
                  <img src='/admin/public/img/logo.png' />
                </figure>
              </div>
              <div className='card-container'>
                <h1 className='is-size-5 pad-bottom'>
                  Bienvenido, Administrador
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
                            className='button is-danger is-fullwidth'
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
