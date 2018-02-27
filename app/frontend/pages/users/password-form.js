import React, { Component } from 'react'
import Loader from '~base/components/spinner'

import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  EmailWidget,
  SelectWidget,
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
      projects: [],
      projectRequired: false
    }
  }

  async componentDidMount () {
    if (this.state.formData.role) {
      var role = this.props.roles.find((item) => {
        return item._id === this.state.formData['role']
      })

      if (role && role.slug === 'manager-level-1') {
        await this.loadProjects()
        this.setState({projectRequired: true})
      }
    }
  }

  errorHandler (e) {}

  async changeHandler ({formData}) {
    if (formData.role && this.state.formData.role !== formData.role) {
      var role = this.props.roles.find((item) => {
        return item._id === formData['role']
      })
      console.log(role)

      if (role && role.slug === 'manager-level-1') {
        await this.loadProjects()
        this.setState({projectRequired: true})
      } else {
        this.setState({projectRequired: false})
      }
    }

    this.setState({
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
  }

  async loadProjects () {
    var url = '/app/projects/'
    const body = await api.get(url, {
      start: 0,
      limit: 0
    })

    this.setState({
      projects: body.data
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
    if (this.state.projectRequired && !formData['project']) {
      this.setState({
        error: 'Para el rol Manager Level 1 es necesario un proyecto',
        apiCallErrorMessage: 'message is-danger'
      })
    } else {
      formData.password = formData.password_1
      formData.password_1 = ''
      formData.password_2 = ''

      if (this.props.submitHandler) this.props.submitHandler(formData)

      try {
        if (this.props.filters) {
          formData = {
            ...formData,
            ...this.props.filters
          }
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
  }

  render () {
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    var schema = {
      type: 'object',
      title: '',
      required: [
        'email', 'name', 'password_1', 'password_2'
      ],
      properties: {
        name: {type: 'string', title: 'Nombre'},
        email: {type: 'string', title: 'Email'},
        password_1: {type: 'string', title: 'Contraseña'},
        password_2: {type: 'string', title: 'Confirmar Contraseña'},
        role: {
          type: 'string',
          title: 'Rol',
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
      role: {'ui:widget': SelectWidget},
      group: {'ui:widget': SelectWidget}
    }
    console.log(this.state)

    if (this.state.formData['role']) {
      var role = this.props.roles.find((item) => {
        return item._id === this.state.formData['role']
      })
      if (role.slug === 'manager-level-1') {
        schema.properties['project'] = { type: 'string', title: 'Project', enum: [], enumNames: [] }
        uiSchema['project'] = {'ui:widget': SelectWidget}
      } else {
        delete schema.properties['project']
        delete uiSchema['project']
        delete this.state.formData['project']
        schema.required = ['email', 'name']
      }
    }

    if (this.props.roles.length === 0) {
      return <Loader />
    }

    schema.properties.role.enum = this.props.roles.map(item => { return item._id })
    schema.properties.role.enumNames = this.props.roles.map(item => { return item.name })

    if (schema.properties.group) {
      schema.properties.group.enum = this.props.groups.map(item => { return item.uuid })
      schema.properties.group.enumNames = this.props.groups.map(item => { return item.name })
    }

    if (schema.properties.project) {
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
          {this.props.children}
        </BaseForm>
      </div>
    )
  }
}

export default PasswordUserForm
