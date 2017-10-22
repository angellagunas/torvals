import React, { Component } from 'react'

import api from '~base/api'
import env from '~base/env-variables'
import tree from '~core/tree'

import {BaseForm, PasswordWidget, EmailWidget} from '~components/base-form'

const schema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {type: 'string', title: 'Email'},
    password: {type: 'string', title: 'Password'}
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
      apiCallErrorMessage: 'is-hidden'
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    this.setState({
      formData,
      apiCallErrorMessage: 'is-hidden'
    })
  }

  async submitHandler ({formData}) {
    var data
    try {
      data = await api.post('/user/login', formData)
    } catch (e) {
      console.log(e)
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger',
        formData: {
          email: '',
          password: ''
        }
      })
    }

    if (data.isAdmin) {
      window.localStorage.setItem('jwt', data.jwt)
      tree.set('jwt', data.jwt)
      tree.set('user', data.user)
      tree.set('loggedIn', true)
      tree.commit()

      this.props.history.push(env.PREFIX + '/', {})
    } else {
      this.setState({
        error: 'Invalid user',
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

    return (
      <div className='LogIn single-form'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Log in
            </p>
          </header>
          <div className='card-content'>
            <div className='content'>
              <BaseForm schema={schema}
                uiSchema={uiSchema}
                formData={this.state.formData}
                onChange={(e) => { this.changeHandler(e) }}
                onSubmit={(e) => { this.submitHandler(e) }}
                onError={(e) => { this.errorHandler(e) }}>
                <div className={this.state.apiCallErrorMessage}>
                  <div className='message-body is-size-7 has-text-centered'>
                    {error}
                  </div>
                </div>
                <div>
                  <button className='button is-primary is-fullwidth' type='submit'>Log in</button>
                </div>
              </BaseForm>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default LogIn
