import React, { Component } from 'react'
import Page from '~base/page'

import api from '~base/api'
import Loader from '~base/components/spinner'
import tree from '~core/tree'

import {BaseForm, EmailWidget} from '~components/base-form'

const schema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: {type: 'string', title: 'Email'}
  }
}

const uiSchema = {
  email: {'ui:widget': EmailWidget}
}

class ResetPassword extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: false,
      formData: {
        email: ''
      },
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }
  }

  componentWillMount () {
    this.clearStorage()
  }

  async clearStorage () {
    window.localStorage.removeItem('jwt')
    tree.set('jwt', null)
    tree.set('user', null)
    tree.set('loggedIn', false)
    tree.set('organization', null)
    tree.set('role', null)
    await tree.commit()
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    if (!this.state.bigError) {
      this.setState({
        formData,
        apiCallMessage: 'is-hidden',
        apiCallErrorMessage: 'is-hidden',
        error: ''
      })
    }
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  async submitHandler ({formData}) {
    this.setState({loading: true})

    try {
      await api.post('/user/reset-password', formData)
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger',
        loading: false
      })
    }

    this.setState({loading: false})

    this.setState({...this.state, apiCallMessage: 'message is-success'})

    setTimeout(() => {
      this.props.history.push('/', {})
    }, 5000)
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

    return (
      <div className='LogIn single-form'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Restabler contraseña
            </p>
            <a className='card-header-icon'>
              <span className='icon'>
                <i className='fa fa-angle-down' />
              </span>
            </a>
          </header>
          <div className='card-content'>
            <div className='content'>
              <p>
                Necesitamos tu dirección de correo para enviarte un link de restablecimiento de la contraseña:
              </p>
              <BaseForm schema={schema}
                uiSchema={uiSchema}
                formData={this.state.formData}
                onSubmit={(e) => { this.submitHandler(e) }}
                onError={(e) => { this.errorHandler(e) }}
                onChange={(e) => { this.changeHandler(e) }}
              >
                { spinner }
                <div className={this.state.apiCallMessage}>
                  <div className='message-body is-size-7 has-text-centered'>
                    El e-mail ha sido enviado. El link tendrá una vigencia de 10 dias.
                  </div>
                </div>
                <div className={this.state.apiCallErrorMessage}>
                  <div className='message-body is-size-7 has-text-centered'>
                    {error}
                  </div>
                </div>
                <button
                  className='button is-primary is-fullwidth'
                  type='submit'
                  disabled={!!error}
                >
                  Enviar link a la dirección de correo
                </button>
              </BaseForm>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/password/forgotten',
  title: 'Reset Password',
  exact: true,
  component: ResetPassword
})
