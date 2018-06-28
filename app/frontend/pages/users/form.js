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

class UserForm extends Component {
  constructor (props) {
    props.initialState.role = props.initialState.roleDetail.uuid
    super(props)

    this.state = {
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      projects: []
    }
  }

  errorHandler (e) {}

  async changeHandler ({formData}) {
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
        error: '¡Se debe seleccionar un rol!',
        apiCallErrorMessage: 'message is-danger'
      })
    }
    if (this.props.submitHandler) this.props.submitHandler(formData)
    try {
      let data = await api.post(this.props.url, formData)
      await this.props.load()
      this.clearState()
      this.setState({
        ...this.state,
        apiCallMessage: 'message is-success'
      })
      setTimeout(() => { this.setState({ apiCallMessage: 'is-hidden' }) }, 3000)

      if (this.props.finishUp) {
        this.props.finishUp(data.data)
      }
      return
    } catch (e) {
      if (this.props.errorHandler) this.props.errorHandler(e)
      return this.setState({
        ...this.state,
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  render () {
    const currentUser = tree.get('user')

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

    let uiSchema = {
      name: {'ui:widget': TextWidget},
      email: {'ui:widget': EmailWidget},
      role: {'ui:widget': SelectWidget}
    }

    if (this.state.formData.roleDetail) {
      let role = this.state.formData.roleDetail

      if (role && role.slug === 'manager-level-1') {
        schema.properties['project'] = { type: 'string', title: 'Proyecto', enum: [], enumNames: [] }
        uiSchema['project'] = {'ui:widget': SelectWidget}
        schema.required.push('project')
      } else {
        delete schema.properties['project']
        delete uiSchema['project']
        delete this.state.formData['project']
        schema.required = ['email']
      }
    }

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
    }

    schema.properties.role.enum = this.props.roles.map(item => { return item.uuid })
    schema.properties.role.enumNames = this.props.roles.map(item => { return item.name })
    if (schema.properties.project) {
      schema.properties.project.enum = this.props.projects.map(item => { return item.uuid })
      schema.properties.project.enumNames = this.props.projects.map(item => { return item.name })
    }
    if (this.props.disabled) {
      for (let field in uiSchema) {
        uiSchema[field]['ui:disabled'] = true
      }
      schema.properties.role.enum.push(this.state.formData.roleDetail.uuid)
      schema.properties.role.enumNames.push(this.state.formData.roleDetail.name)
    }

    if (this.props.disabledRoles) {
      uiSchema['role']['ui:disabled'] = true
    }

    if (currentUser.currentRole.slug === 'orgadmin') {
      uiSchema['role']['ui:disabled'] = false
      for (let field in uiSchema) {
        uiSchema[field]['ui:disabled'] = false
      }
      schema.properties.role.enum.push(currentUser.currentRole.uuid)
      schema.properties.role.enumNames.push(currentUser.currentRole.name)
    }

    return (
      <div>
        <BaseForm
          schema={schema}
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
