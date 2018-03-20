import React, { Component } from 'react'
import api from '~base/api'
import tree from '~core/tree'

import {BaseForm, EmailWidget, TextWidget, FileWidget} from '~base/components/base-form'

const schema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: {type: 'string', title: 'Nombre'},
    email: {type: 'string', title: 'Email'},
    profile: {type: 'string', title: 'Foto', format: 'data-url'}
  }
}

const uiSchema = {
  name: {'ui:widget': TextWidget},
  email: {'ui:widget': EmailWidget},
  profile: {'ui:widget': FileWidget}
}

class UpdateProfileForm extends Component {
  constructor (props) {
    super(props)

    let email
    let name

    if (tree.get('user')) {
      name = tree.get('user').name
      email = tree.get('user').email
    }

    this.state = {
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: {
        email,
        name
      },
      isLoading: ''
    }
  }

  errorHandler (e) {
    this.setState({ isLoading: '' })
  }

  finishUpHandler () {
    this.setState({ isLoading: '' })
  }

  changeHandler ({formData}) {
    this.setState({formData, apiCallMessage: 'is-hidden', apiCallErrorMessage: 'is-hidden'})
  }

  async submitHandler ({formData}) {
    var data
    this.setState({ isLoading: ' is-loading' })
    try {
      data = await api.post('/user/me/update', formData)
      this.finishUpHandler()
    } catch (e) {
      this.errorHandler(e)
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }

    this.setState({apiCallMessage: 'message is-success'})
    const cursor = tree.select('user')
    cursor.set('profileUrl', data.user.profileUrl)
    cursor.set('name', data.user.name)
    tree.commit()
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
            <div className='message-body is-size-7 has-text-centered'>Tus datos se han modificado correctamente</div>
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

export default UpdateProfileForm
