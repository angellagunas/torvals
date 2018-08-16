import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import Loader from '~base/components/spinner'
import { testRoles } from '~base/tools'
import tree from '~core/tree'

import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  EmailWidget,
  SelectWidget
} from '~base/components/base-form'

class InviteUserForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      projects: [],
      cannotCreate: false
    }
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  async componentWillMount () {
    await this.loadProjects()

    if (this.state.formData.role) {
      var role = this.props.roles.find((item) => {
        return item.uuid === this.state.formData.role
      })
      if (role && role.slug === 'manager-level-1') {
        if (this.state.projects.length === 0) {
          this.setState({
            error: this.formatTitle('user.formProjectErrorMsg'),
            apiCallErrorMessage: 'message is-danger',
            cannotCreate: true
          })
        }
      }
    }
  }

  errorHandler (e) {}

  async changeHandler ({formData}) {
    if (formData.role && this.state.formData.role !== formData.role) {
      var role = this.props.roles.find((item) => {
        return item.uuid === formData['role']
      })

      if (role && role.slug === 'manager-level-1') {
        await this.loadProjects()
        if (this.state.projects.length === 0) {
          return this.setState({
            formData,
            error: this.formatTitle('user.formProjectErrorMsg'),
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

  async updateStep () {
    try {
      let user = tree.get('user')
      if (user.currentOrganization.wizardSteps.users) {
        return
      }
      let url = '/app/organizations/' + user.currentOrganization.uuid + '/step'

      let res = await api.post(url, {
        step: {
          name: 'users',
          value: true
        }
      })

      if (res) {
        let me = await api.get('/user/me')
        tree.set('user', me.user)
        tree.set('organization', me.user.currentOrganization)
        tree.set('rule', me.rule)
        tree.set('role', me.user.currentRole)
        tree.set('loggedIn', me.loggedIn)
        tree.commit()
        return true
      } else {
        return false
      }
    } catch (e) {
      console.log(e)
      return false
    }
  }

  async submitHandler ({formData}) {
    formData.sendInvite = true

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
      await this.updateStep()
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
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    var schema = {
      type: 'object',
      title: '',
      required: ['email', 'name'],
      properties: {
        name: {type: 'string', title: this.formatTitle('user.formName')},
        email: {type: 'string', title: this.formatTitle('user.formEmail')},
        role: {
          type: 'string',
          title: this.formatTitle('user.formRole'),
          enum: [],
          enumNames: [],
          default: 'manager-level-1'
        },
        group: {
          type: 'string',
          title: this.formatTitle('user.formGroup'),
          enum: [],
          enumNames: []
        }
      }
    }

    const uiSchema = {
      name: {'ui:widget': TextWidget},
      email: {'ui:widget': EmailWidget},
      role: {'ui:widget': SelectWidget},
      group: {'ui:widget': SelectWidget}
    }

    if (this.props.initialState.groups) {
      uiSchema['groups']['ui:disabled'] = true
    }

    if (this.state.formData.role) {
      var role = this.props.roles.find((item) => {
        return item.uuid === this.state.formData.role
      })
      if (role && role.slug === 'manager-level-1') {
        schema.properties['project'] = {
          type: 'string',
          title: this.formatTitle('user.formProject'),
          enum: [],
          enumNames: []
        }
        uiSchema['project'] = {'ui:widget': SelectWidget}
        schema.required.push('project')
      } else {
        delete schema.properties['project']
        delete uiSchema['project']
        delete this.state.formData['project']
        schema.required = ['email', 'name']
      }
    }

    if (this.props.filters) {
      if (this.props.filters.group) {
        delete uiSchema.group
        delete schema.properties.group
      }
    }

    if (this.props.roles.length === 0) {
      return <Loader />
    }

    schema.properties.role.enum = this.props.roles.map(item => { return item.uuid })
    schema.properties.role.enumNames = this.props.roles.map(item => { return item.name })

    if (this.props.groups && this.props.groups.length > 0) {
      if (schema.properties.group) {
        schema.properties.group.enum = this.props.groups.map(item => { return item.uuid })
        schema.properties.group.enumNames = this.props.groups.map(item => { return item.name })
      } else {
        schema.properties['group'] = {
          type: 'string',
          title: this.formatTitle('user.formGroup'),
          enum: [],
          enumNames: []
        }
        uiSchema['group'] = {'ui:widget': SelectWidget}
        schema.properties.group.enum = this.props.groups.map(item => { return item.uuid })
        schema.properties.group.enumNames = this.props.groups.map(item => { return item.name })
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

    if (testRoles('consultor-level-3')) {
      delete uiSchema['role']
      delete schema.properties['role']
      delete schema.properties['project']
      delete uiSchema['project']
      delete this.state.formData['project']
      schema.required = ['email', 'name']
    }

    if (testRoles('manager-level-2')) {
      delete schema.properties.group
      delete uiSchema.group
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
              <FormattedMessage
                id='user.inviteMsg'
                defaultMessage={`!Se ha enviado la invitación correctamente! La invitación estará vigente durante 24 horas.`}
              />
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

export default injectIntl(InviteUserForm)
