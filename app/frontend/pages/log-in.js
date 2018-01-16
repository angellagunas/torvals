import React, { Component } from 'react'

import api from '~base/api'
import cookies from '~base/cookies'
import Loader from '~base/components/spinner'
import Link from '~base/router/link'
import env from '~base/env-variables'
import Page from '~base/page'
import {forcePublic} from '~base/middlewares/'

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
      loading: false,
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
        error: 'El usuario no tiene una organización asignada!',
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
      const baseUrl = env.APP_HOST.split('://')

      const organization = user.organizations[0].organization
      cookies.set('jwt', data.jwt)
      cookies.set('organization', organization.slug)

      window.location = baseUrl[0] + '://' + organization.slug + '.' + baseUrl[1] + '/dashboard'
    }
  }

  selectOrgHandler (slug) {
    const baseUrl = env.APP_HOST.split('://')

    cookies.set('jwt', this.state.jwt)
    window.location = baseUrl[0] + '://' + slug + '.' + baseUrl[1] + '/dashboard'
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
                  className='navbar-item '
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
                  className='navbar-item '
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
            Forgot password?
          </Link>
        </p>
      )
    }

    if (this.state.shouldSelectOrg) {
      return <div className={'LogIn single-form ' + this.props.className}>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Select Organization to log in
            </p>
            <a className='card-header-icon'>
              <span className='icon'>
                <i className='fa fa-angle-down' />
              </span>
            </a>
          </header>
          <div className='card-content'>
            <div className='content'>
              { spinner }
              {this.getDropdown()}
            </div>
          </div>
        </div>
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
              <div className='columns'>
                <div className='column'>
                  <BaseForm schema={schema}
                    uiSchema={uiSchema}
                    formData={this.state.formData}
                    onSubmit={(e) => { this.submitHandler(e) }}
                    onError={(e) => { this.errorHandler(e) }}
                    onChange={(e) => { this.changeHandler(e) }}
                  >
                    { spinner }
                    <div className={this.state.apiCallErrorMessage}>
                      <div className='message-body is-size-7 has-text-centered'>
                        {error}
                      </div>
                    </div>
                    <div>
                      <button
                        className='button is-primary is-fullwidth'
                        type='submit'
                        disabled={!!error}
                      >
                        Log in
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
  title: 'Log in',
  exact: true,
  validate: forcePublic,
  component: LogIn
})
