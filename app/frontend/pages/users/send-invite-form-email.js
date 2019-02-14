import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import Loader from '~base/components/spinner'
import { testRoles } from '~base/tools'
import tree from '~core/tree'

import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  TextareaWidget,
  EmailWidget,
  SelectWidget
} from '~base/components/base-form'

class InviteUserFormEmail extends Component {
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

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }



  async submitHandler ({formData}) {
    formData.sendEmail = true

    if (this.props.submitHandler) this.props.submitHandler(formData)
    try {
      if (this.props.filters) {
        formData = {
          ...formData,
          ...this.props.filters
        }
      }
      var data = await api.post('/app/users/sendEmail', formData)
      //await this.props.load()
      this.clearState()
      //this.setState({...this.state, apiCallMessage: 'message is-success'})
      if (this.props.finishUp) this.props.finishUp(data.data)
     // await this.updateStep()
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
      required: ['subject', 'body'],
      properties: {

        subject: {type: 'string', title: this.formatTitle('user.formSendEmailSubject')},
        body: {type: 'string', title: this.formatTitle('user.formSendEmailBody')}
      }
    }

    const uiSchema = {

      subject: {'ui:widget': TextWidget},
      body: {'ui:widget': TextareaWidget}
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

export default injectIntl(InviteUserFormEmail)
