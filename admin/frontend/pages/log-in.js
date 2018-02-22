import React, { Component } from 'react'

import Page from '~base/page'
import api from '~base/api'
import env from '~base/env-variables'
import tree from '~core/tree'
import Link from '~base/router/link'
import {forcePublic} from '~base/middlewares/'

import {BaseForm, PasswordWidget, EmailWidget} from '~components/base-form'

const schema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {type: 'string', title: 'Correo'},
    password: {type: 'string', title: 'Contraseña'}
  }
}

const uiSchema = {
  password: {'ui:widget': PasswordWidget},
  email: {'ui:widget': EmailWidget}
}

class LogIn extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        email: '',
        password: ''
      },
      apiCallErrorMessage: 'is-hidden',
      isLoading: ''
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
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
    this.setState({isLoading: ' is-loading'})
    var data
    try {
      data = await api.post('/user/login', formData)
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger',
        isLoading: ''
      })
    }

    if (data.isAdmin) {
      window.localStorage.setItem('jwt', data.jwt)
      tree.set('jwt', data.jwt)
      tree.set('user', data.user)
      tree.set('loggedIn', true)
      tree.commit()
      this.setState({isLoading: ''})

      this.props.history.push(env.PREFIX + '/', {})
    } else {
      this.setState({
        error: 'Usuario inválido!',
        apiCallErrorMessage: 'message is-danger',
        isLoading: '',
        formData: {
          email: '',
          password: ''
        }
      })
    }
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
      <div className='LogIn single-form'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Acceder a Admin
            </p>
            <a className='card-header-icon'>
              <span className='icon'>
                <i className='fa fa-angle-down' />
              </span>
            </a>
          </header>
          <div className='card-content'>
            <div className='content'>
              <div className='columns'>
                <div className='column'>
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
                        className={'button is-primary is-fullwidth' + this.state.isLoading}
                        type='submit'
                        disabled={!!error || !!this.state.isLoading}
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
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/log-in',
  exact: true,
  validate: forcePublic,
  component: LogIn
})
