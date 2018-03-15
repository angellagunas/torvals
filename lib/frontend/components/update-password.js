import React, { Component } from 'react'
import api from '~base/api'
import {BaseForm, PasswordWidget} from '~components/base-form'

const schema = {
  type: 'object',
  required: ['password', 'newPassword', 'confirmPassword'],
  properties: {
    password: {type: 'string', title: 'Contraseña actual'},
    newPassword: {type: 'string', title: 'Nueva contraseña'},
    confirmPassword: {type: 'string', title: 'Confirmar contraseña'}
  }
}

const uiSchema = {
  password: {'ui:widget': PasswordWidget},
  newPassword: {'ui:widget': PasswordWidget},
  confirmPassword: {'ui:widget': PasswordWidget}
}

class UpdatePasswordForm extends Component {
  constructor (props) {
    super(props)

    this.state = {
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: {
        password: '',
        newPassword: '',
        confirmPassword: ''
      },
      isLoading: ''
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    this.setState({formData, apiCallMessage: 'is-hidden', apiCallErrorMessage: 'is-hidden'})
  }

  async submitHandler ({formData}) {
    this.setState({ isLoading: ' is-loading' })
    try {
      await api.post('/user/me/update-password', formData)
      this.finishUpHandler()
    } catch (e) {
      this.errorHandler(e)
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger',
        formData: {
          ...formData,
          password: ''
        }
      })
    }

    this.setState({
      apiCallMessage: 'message is-success',
      apiCallErrorMessage: 'is-hidden',
      formData: {
        password: '',
        newPassword: '',
        confirmPassword: ''
      }
    })
  }

  render () {
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    return (
      <div className='is-fullwidth'>
        <BaseForm schema={schema}
          uiSchema={uiSchema}
          formData={this.state.formData}
          onChange={(e) => { this.changeHandler(e) }}
          onSubmit={(e) => { this.submitHandler(e) }}
          onError={(e) => { this.errorHandler(e) }}
          className='is-fullwidth'>
          <div className={this.state.apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>La contraseña se ha modificado correctamente</div>
          </div>

          <div className={this.state.apiCallErrorMessage}>
            <div className='message-body is-size-7 has-text-centered'>{error}</div>
          </div>

          <div>
            <button
              className={'button is-primary ' + this.state.isLoading}
              disabled={!!this.state.isLoading}
              type='submit'
              >
                Guardar
              </button>
          </div>
        </BaseForm>
      </div>
    )
  }
}

export default UpdatePasswordForm
