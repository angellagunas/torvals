import React, { Component } from 'react'
import Page from '~base/page'

import tree from '~core/tree'
import api from '~base/api'
import Loader from '~base/components/spinner'
import cookies from '~base/cookies'
import env from '~base/env-variables'

import {BaseForm, PasswordWidget} from '~base/components/base-form'

class EmailActivateLanding extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: false,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      user: {}
    }
  }

  componentWillMount () {
    this.verifyToken()
  }

  errorHandler (e) {}

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
  }

  async verifyToken () {
    var search = decodeURIComponent(this.props.location.search)
      .substring(1)
      .split('&')
    let tokenData = {}

    for (var param of search) {
      var spl = param.split('=')
      tokenData[spl[0]] = spl[1]
    }
    console.log('tokenData', tokenData)
    var data
    try {
      data = await api.post('/emails/activation/validate', tokenData)
    } catch (e) {
      return this.setState({
        ...this.state,
        error: e.message,
        bigError: true,
        apiCallErrorMessage: 'message is-danger',
        apiCallMessage: 'is-hidden'
      })
    }

    this.setState({
      apiCallMessage: 'message is-success',
      apiCallErrorMessage: 'is-hidden',
      user: data.user
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

    return (
      <div className='Invited single-form'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Activación de cuenta
            </p>
          </header>
          <div className='card-content'>
            <div className='content'>
              { spinner }
              {this.state.user && this.state.user.isVerified
              ? <div>
                <div className={this.state.apiCallMessage}>
                  <div className='message-body is-size-7 has-text-centered'>
                    ¡Hola {this.state.user.name}, tu cuenta ha sida activada exitosamente!
                  </div>
                </div>
                <p> Ahora puedes usar tu cuenta para acceder, <a href='/landing' > da click aqui </a></p>
              </div>
              : <div className={this.state.apiCallErrorMessage}>
                <div className='message-body is-size-7 has-text-centered'>
                  {error}
                </div>
              </div>
            }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/emails/activate',
  title: 'Email activate',
  exact: true,
  component: EmailActivateLanding
})
