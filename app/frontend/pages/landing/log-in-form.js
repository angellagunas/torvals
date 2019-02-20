import React, { Component } from 'react'

import api from '~base/api'
import env from '~base/env-variables'
import Link from '~base/router/link'
import cookies from '~base/cookies'
import Loader from '~base/components/spinner'
import tree from '~core/tree'
import { injectIntl } from 'react-intl'

import { BaseForm, PasswordWidget, EmailWidget } from '~components/base-form'

const uiSchema = {
  password: { 'ui:widget': PasswordWidget },
  email: { 'ui:widget': EmailWidget }
}

class LogInButton extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
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

    let data
    try {
      data = await api.post('/v2/auth', formData)
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger',
        loading: false
      })
    }

    this.setState({loading: false})

    localStorage.setItem('lang', 'es-MX')

    this.setState({
      jwt: data.token
    })

    cookies.set('jwt', data.token)
    cookies.set('organization', 'barcel')
    tree.set('jwt', data.token)
    window.location = '/dashboard'
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

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  render () {
    const schema = {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', title: this.formatTitle('login.email') },
        password: { type: 'string', title: this.formatTitle('login.pass') }
      }
    }
    let spinner

    if (this.state.loading) {
      spinner = <Loader />
    }

    let error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    return (
      <div>
        <div className={'modal' + this.props.modalClass}>
          <div className='modal-content land-login'>
            <section>
              <div className='card-image'>
                <figure className='image'>
                  <img src='/app/public/img/logo.png' />
                </figure>
              </div>
              <div className='card-container'>
                <h1 className='is-size-4 pad-bottom'>
                  {this.formatTitle('login.welcome')}
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
                            { this.formatTitle('login.loginBtn') }
                          </button>
                        </div>
                      </BaseForm>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  }
}
export default injectIntl(LogInButton)
