import React, { Component } from 'react'
import Page from '~base/page'

import tree from '~core/tree'
import api from '~base/api'
import Loader from '~base/components/spinner'
import cookies from '~base/cookies'
import env from '~base/env-variables'

import {BaseForm, PasswordWidget} from '~base/components/base-form'

function validate (formData, errors) {
  if (formData.password_1 !== formData.password_2) {
    errors.password_2.addError('Las contraseñas no concuerdan')
  }
  return errors
}

const schema = {
  type: 'object',
  required: ['password_1', 'password_2'],
  properties: {
    password_1: {type: 'string', title: 'Contraseña'},
    password_2: {type: 'string', title: 'Confirmar Contraseña'}
  }
}

const uiSchema = {
  password_2: {'ui:widget': PasswordWidget},
  password_1: {'ui:widget': PasswordWidget}
}

class EmailResetLanding extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: false,
      formData: {
        password_1: '',
        password_2: ''
      },
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      user: {}
    }
  }

  componentWillMount () {
    // this.clearStorage()
    this.verifyToken()
  }

  async clearStorage () {
    cookies.remove('jwt')
    cookies.remove('organization')
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

  async verifyToken () {
    var search = decodeURIComponent(this.props.location.search)
      .substring(1)
      .split('&')
    let tokenData = {}

    for (var param of search) {
      var spl = param.split('=')
      tokenData[spl[0]] = spl[1]
    }

    var data
    try {
      data = await api.post('/emails/reset/validate', tokenData)
    } catch (e) {
      return this.setState({
        ...this.state,
        error: e.message,
        bigError: true,
        apiCallErrorMessage: 'message is-danger'
      })
    }

    this.setState({
      ...this.state,
      user: data.user
    })
  }

  async submitHandler ({formData}) {
    formData.uuid = this.state.user.uuid
    formData.password = formData.password_1

    var data
    try {
      data = await api.post('/user/set-password', formData)
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }

    let user = data.user

    if (!user.organizations || user.organizations.length === 0) {
      return this.setState({
        error: 'El usuario no tiene una organización asignada, No se puede iniciar sesión automáticamente!',
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

      window.location = baseUrl[0] + '://' + organization.slug + '.' + baseUrl[1]
    }
  }

  selectOrgHandler (slug) {
    const baseUrl = env.APP_HOST.split('://')

    cookies.set('jwt', this.state.jwt)
    window.location = baseUrl[0] + '://' + slug + '.' + baseUrl[1]
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

    if (this.state.shouldSelectOrg) {
      return <div className={'LogIn single-form ' + this.props.className}>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Selecciona una organización
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
      <div className='Reset single-form'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Hola {this.state.user.name}!
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
                Necesitas crear una contraseña antes de poder iniciar sesión puedes crearla aquí
              </p>
              <BaseForm schema={schema}
                uiSchema={uiSchema}
                formData={this.state.formData}
                onSubmit={(e) => { this.submitHandler(e) }}
                onError={(e) => { this.errorHandler(e) }}
                onChange={(e) => { this.changeHandler(e) }}
                validate={validate}
                showErrorList={false}
              >
                { spinner }
                <div className={this.state.apiCallMessage}>
                  <div className='message-body is-size-7 has-text-centered'>
                    Contraseña creada con éxito! Te redirigiremos a la
                    aplicación en un segundo.
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
                  disabled={!!error || this.state.bigError}
                  >
                    Reiniciar contraseña
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
  path: '/emails/reset',
  title: 'Email reset',
  exact: true,
  component: EmailResetLanding
})
