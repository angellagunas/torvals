import React, { Component } from 'react'
import Loader from '~base/components/spinner'

import api from '~base/api'

import {
  BaseForm,
  SelectWidget
} from '~base/components/base-form'

var schema = {
  type: 'object',
  title: '',
  required: [
    'role', 'organization'
  ],
  properties: {
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
    }
  }
}

const uiSchema = {
  role: {'ui:widget': SelectWidget},
  organization: {'ui:widget': SelectWidget}
}

class OrganizationRoleForm extends Component {
  constructor (props) {
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
    if (formData['role']) {
      var role = this.props.roles.find((item) => {
        return item.uuid === formData['role']
      })

      if (role.slug === 'manager-level-1') {
        schema.properties['project'] = { type: 'string', title: 'Project', enum: [], enumNames: [] }
        uiSchema['project'] = {'ui:widget': SelectWidget}
        schema.required.push('project')

        if (formData['organization']) {
          var organization = this.props.orgs.find((item) => {
            return item.uuid === formData['organization']
          })
          await this.loadProjects(organization.uuid)
        }
      } else {
        delete schema.properties['project']
        delete uiSchema['project']
        delete formData['project']
        schema.required = ['role', 'organization']
      }
    }

    this.setState({
      key: Math.random(),
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
  }

  async loadProjects (organization) {
    var url = '/admin/projects/'
    const body = await api.get(url, {
      start: 0,
      limit: 0,
      organization: organization
    })

    this.setState({
      projects: body.data,
      key: Math.random()
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
    try {
      var data = await api.post(this.props.url, formData)
      this.props.load()
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
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    if (this.props.roles.length === 0 || this.props.orgs.length === 0) {
      return <Loader />
    }

    schema.properties.role.enum = this.props.roles.map(item => { return item.uuid })
    schema.properties.role.enumNames = this.props.roles.map(item => { return item.name })
    schema.properties.organization.enum = this.props.orgs.map(item => { return item.uuid })
    schema.properties.organization.enumNames = this.props.orgs.map(item => { return item.name })

    if (schema.properties.project) {
      schema.properties.project.enum = this.state.projects.map(item => { return item.uuid })
      schema.properties.project.enumNames = this.state.projects.map(item => { return item.name })
    }

    return (
      <div>
        <BaseForm
          key={this.state.key}
          schema={schema}
          uiSchema={uiSchema}
          formData={this.state.formData}
          onChange={(e) => { this.changeHandler(e) }}
          onSubmit={(e) => { this.submitHandler(e) }}
          onError={(e) => { this.errorHandler(e) }}
        >
          <div className={this.state.apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              Se ha agregado correctamente la organización!
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

export default OrganizationRoleForm
