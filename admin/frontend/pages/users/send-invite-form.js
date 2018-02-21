import React, { Component } from 'react'
import Loader from '~base/components/spinner'

import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  EmailWidget,
  SelectWidget,
  CheckboxWidget
} from '~base/components/base-form'

class InviteUserForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      groups: [],
      projects: []
    }
  }

  errorHandler (e) {}

  async changeHandler ({formData}) {
    await this.loadProjects(formData.organization)
    await this.changeGroups(formData.organization)

    this.setState({
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
  }

  async loadProjects (organization) {
    if (organization) {
      var org = this.props.orgs.find((item) => {
        return item._id === organization
      })

      var url = '/admin/projects/'
      const body = await api.get(url, {
        start: 0,
        limit: 0,
        organization: org.uuid
      })

      this.setState({
        projects: body.data
      })
    }
  }

  async changeGroups (organization) {
    if (organization) {
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
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  async submitHandler ({formData}) {
    formData.sendInvite = true
    if (this.props.submitHandler) this.props.submitHandler(formData)
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
      if (this.props.errorHandler) this.props.errorHandler(e)
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
        'email', 'organization'
      ],
      properties: {
        name: {type: 'string', title: 'Nombre'},
        email: {type: 'string', title: 'Email'},
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
      isAdmin: {'ui:widget': CheckboxWidget},
      role: {'ui:widget': SelectWidget},
      organization: { 'ui:widget': SelectWidget },
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

    if (this.props.filters) {
      if (this.props.filters.group) {
        delete uiSchema.groups
        delete schema.properties.groups
      }
    }

    if (this.state.formData.role) {
      var role = this.props.roles.find((item) => {
        return item._id === this.state.formData.role
      })
      if (role.slug === 'manager-level-1') {
        schema.properties['project'] = { type: 'string', title: 'Project', enum: [], enumNames: [] }
        uiSchema['project'] = {'ui:widget': SelectWidget}
        schema.required.push('project')
      } else {
        delete schema.properties['project']
        delete uiSchema['project']
        delete this.state.formData['project']
        schema.required = ['email', 'organization']
      }
    }

    if (this.props.roles.length === 0 || this.props.orgs.length === 0) {
      return <Loader />
    }

    schema.properties.role.enum = this.props.roles.map(item => { return item._id })
    schema.properties.role.enumNames = this.props.roles.map(item => { return item.name })
    schema.properties.organization.enum = this.props.orgs.map(item => { return item._id })
    schema.properties.organization.enumNames = this.props.orgs.map(item => { return item.name })

    if (schema.properties.groups) {
      schema.properties.groups.enum = this.state.groups.map(item => { return item._id })
      schema.properties.groups.enumNames = this.state.groups.map(item => { return item.name })
    }
    if (schema.properties.project) {
      schema.properties.project.enum = this.state.projects.map(item => { return item.uuid })
      schema.properties.project.enumNames = this.state.projects.map(item => { return item.name })
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
              Se ha enviado la invitación correctamente!
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

export default InviteUserForm
