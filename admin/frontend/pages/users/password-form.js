import React, { Component } from 'react'
import Loader from '~base/components/spinner'

import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  EmailWidget,
  SelectWidget,
  CheckboxWidget,
  PasswordWidget
} from '~base/components/base-form'

function validate (formData, errors) {
  if (formData.password_1 !== formData.password_2) {
    errors.password_2.addError("Passwords don't match!")
  }
  return errors
}

class PasswordUserForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      groups: []
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    this.setState({
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
    this.changeGroups(formData.organization)
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  async changeGroups (organization) {
    var url = '/admin/groups/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0,
        organization: organization
      }
    )

    this.setState({
      ...this.state,
      groups: body.data
    })
  }

  async submitHandler ({formData}) {
    formData.password = formData.password_1
    formData.password_1 = ''
    formData.password_2 = ''

    try {
      if (this.props.filters) {
        formData = {...formData,
          ...this.props.filters}
      }

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
    var schema = {
      type: 'object',
      title: '',
      required: [
        'email', 'password_1', 'password_2', 'organization'
      ],
      properties: {
        name: {type: 'string', title: 'Nombre'},
        email: {type: 'string', title: 'Email'},
        password_1: {type: 'string', title: 'Contraseña'},
        password_2: {type: 'string', title: 'Confirmar Contraseña'},
        isAdmin: {type: 'boolean', title: 'Es Admin?', default: false},
        role: {
          type: 'string',
          title: 'Rol',
          enum: [],
          enumNames: []
        },
        organization: {
          type: 'string',
          title: 'Organización',
          enum: [],
          enumNames: []
        },
        groups: {
          type: 'string',
          title: 'Grupo',
          enum: [],
          enumNames: []
        }
      }
    }
    
    const uiSchema = {
      name: {'ui:widget': TextWidget},
      email: {'ui:widget': EmailWidget},
      password_1: {'ui:widget': PasswordWidget},
      password_2: {'ui:widget': PasswordWidget},
      isAdmin: {'ui:widget': CheckboxWidget},
      role: {'ui:widget': SelectWidget},
      organization: {'ui:widget': SelectWidget},
      groups: {'ui:widget': SelectWidget}
    }
    
    if (this.props.initialState.organization) {
      uiSchema['organization']['ui:disabled'] = true
    }

    if (this.props.initialState.groups) {
      uiSchema['groups']['ui:disabled'] = true
    }

    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    if (this.props.roles.length === 0 || this.props.orgs.length === 0) {
      return <Loader />
    }

    schema.properties.role.enum = this.props.roles.map(item => { return item._id })
    schema.properties.role.enumNames = this.props.roles.map(item => { return item.name })
    schema.properties.organization.enum = this.props.orgs.map(item => { return item._id })
    schema.properties.organization.enumNames = this.props.orgs.map(item => { return item.name })
    schema.properties.groups.enum = this.state.groups.map(item => { return item._id })
    schema.properties.groups.enumNames = this.state.groups.map(item => { return item.name })

    return (
      <div>
        <BaseForm schema={schema}
          uiSchema={uiSchema}
          formData={this.state.formData}
          onChange={(e) => { this.changeHandler(e) }}
          onSubmit={(e) => { this.submitHandler(e) }}
          onError={(e) => { this.errorHandler(e) }}
          validate={validate}
        >
          <div className={this.state.apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              Se ha creado correctamente al usuario
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

export default PasswordUserForm
