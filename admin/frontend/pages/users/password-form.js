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
      groups: [],
      projects: [],
      cannotCreate: false
    }
  }

  errorHandler (e) {}

  async componentWillMount () {
    if (this.state.formData.organization) {
      await this.loadProjects(this.state.formData.organization)

      if (this.state.formData.role) {
        var role = this.props.roles.find((item) => {
          return item._id === this.state.formData.role
        })
        if (role && role.slug === 'manager-level-1') {
          if (this.state.projects.length === 0) {
            this.setState({
              error: 'No existen proyectos!',
              apiCallErrorMessage: 'message is-danger',
              cannotCreate: true
            })
          }
        }
      }
    }
  }

  async changeHandler ({formData}) {
    console.log(formData)
    if (this.state.formData.organization !== formData.organization) {
      await this.loadProjects(formData.organization)
      await this.changeGroups(formData.organization)

      if (formData.role) {
        var role = this.props.roles.find((item) => {
          return item._id === formData['role']
        })

        if (role && role.slug === 'manager-level-1') {
          console.log('org => ' + this.state.projects.length)
          if (this.state.projects.length === 0) {
            return this.setState({
              formData,
              error: 'No existen proyectos!',
              apiCallErrorMessage: 'message is-danger',
              cannotCreate: true
            })
          } else {
            this.setState({cannotCreate: false})
          }
        } else {
          this.setState({cannotCreate: false})
        }
      }
    }

    if (formData.role && this.state.formData.role !== formData.role) {
      var role = this.props.roles.find((item) => {
        return item._id === formData['role']
      })

      if (role && role.slug === 'manager-level-1') {
        console.log('role => ' + this.state.projects.length)
        if (this.state.projects.length === 0) {
          return this.setState({
            formData,
            error: 'No existen proyectos!',
            apiCallErrorMessage: 'message is-danger',
            cannotCreate: true
          })
        }
      } else {
        this.setState({cannotCreate: false})
      }
    }

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

  async submitHandler ({formData}) {
    formData.password = formData.password_1
    formData.password_1 = ''
    formData.password_2 = ''
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
    console.log(this.state)
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
        group: {
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
      group: {'ui:widget': SelectWidget}
    }

    if (this.props.initialState.organization) {
      uiSchema['organization']['ui:disabled'] = true
    }

    if (this.props.initialState.groups) {
      uiSchema['group']['ui:disabled'] = true
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
      if (role && role.slug === 'manager-level-1') {
        schema.properties['project'] = { type: 'string', title: 'Project', enum: [], enumNames: [] }
        uiSchema['project'] = {'ui:widget': SelectWidget}
        schema.required.push('project')
      } else {
        delete schema.properties['project']
        delete uiSchema['project']
        delete this.state.formData['project']
        schema.required = ['email', 'organization', 'password_1', 'password_2']
      }
    }

    if (this.props.roles.length === 0 || this.props.orgs.length === 0) {
      return <Loader />
    }

    schema.properties.role.enum = this.props.roles.map(item => { return item._id })
    schema.properties.role.enumNames = this.props.roles.map(item => { return item.name })
    schema.properties.organization.enum = this.props.orgs.map(item => { return item._id })
    schema.properties.organization.enumNames = this.props.orgs.map(item => { return item.name })

    if (this.state.groups.length > 0) {
      if (schema.properties.group) {
        schema.properties.group.enum = this.state.groups.map(item => { return item.uuid })
        schema.properties.group.enumNames = this.state.groups.map(item => { return item.name })
      } else {
        schema.properties['group'] = { type: 'string', title: 'Grupo', enum: [], enumNames: [] }
        uiSchema['group'] = {'ui:widget': SelectWidget}
        schema.properties.group.enum = this.state.groups.map(item => { return item.uuid })
        schema.properties.group.enumNames = this.state.groups.map(item => { return item.name })
      }
    } else {
      if (schema.properties.group) {
        delete uiSchema.group
        delete schema.properties.group
      }
    }

    if (schema.properties.project && this.state.projects.length > 0) {
      schema.properties.project.enum = this.state.projects.map(item => { return item.uuid })
      schema.properties.project.enumNames = this.state.projects.map(item => { return item.name })
    }

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
          {!this.state.cannotCreate && this.props.children}
        </BaseForm>
      </div>
    )
  }
}

export default PasswordUserForm
