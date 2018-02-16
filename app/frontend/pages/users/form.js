import React, { Component } from 'react'
import Loader from '~base/components/spinner'
import tree from '~core/tree'

import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  EmailWidget,
  SelectWidget
} from '~base/components/base-form'

var schema = {
  type: 'object',
  title: '',
  required: [
    'email'
  ],
  properties: {
    name: {type: 'string', title: 'Nombre'},
    email: {type: 'string', title: 'Email'},
    role: {
      type: 'string',
      title: 'Rol',
      enum: [],
      enumNames: []
    }
  }
}

const uiSchema = {
  name: {'ui:widget': TextWidget},
  email: {'ui:widget': EmailWidget},
  role: {'ui:widget': SelectWidget}
}

class UserForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    this.setState({
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  async submitHandler ({formData}) {
    if (!formData.role) {
      return this.setState({
        error: 'Se debe seleccionar un rol!',
        apiCallErrorMessage: 'message is-danger'
      })
    }

    try {
      var data = await api.post(this.props.url, formData)
      await this.props.load()
      this.clearState()
      this.setState({...this.state, apiCallMessage: 'message is-success'})
      if (this.props.finishUp) this.props.finishUp(data.data)
      return
    } catch (e) {
      return this.setState({
        ...this.state,
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  render () {
    const currentUser = tree.get('user')
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    if (this.props.roles.length === 0) {
      return <Loader />
    }

    if (this.state.formData.email) {
      uiSchema.email['ui:disabled'] = true
    }

    if (this.props.initialState.uuid === currentUser.uuid) {
      uiSchema.role['ui:disabled'] = true
    } else {
      uiSchema.role['ui:disabled'] = false
    }

    schema.properties.role.enum = this.props.roles.map(item => { return item._id })
    schema.properties.role.enumNames = this.props.roles.map(item => { return item.name })

    return (
      <div>
        <BaseForm schema={schema}
          uiSchema={uiSchema}
          formData={this.state.formData}
          onChange={(e) => { this.changeHandler(e) }}
          onSubmit={(e) => { this.submitHandler(e) }}
          onError={(e) => { this.errorHandler(e) }}
        >
          <div className={this.state.apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              Los datos se han guardado correctamente
            </div>
          </div>

          <div className={this.state.apiCallErrorMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              {error}
            </div>
          </div>
          {this.props.children}
        </BaseForm>
      </div>
    )
  }
}

export default UserForm
