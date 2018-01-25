import React, { Component } from 'react'
import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  SelectWidget
} from '~base/components/base-form'

const schema = {
  type: 'object',
  title: '',
  required: [
    'name',
    'externalId',
    'organization'
  ],
  properties: {
    name: {type: 'string', title: 'Nombre'},
    externalId: {type: 'string', title: 'Id Externo'},
    organization: {
      type: 'string',
      title: 'Organización',
      enum: [],
      enumNames: []
    }
  }
}

const uiSchema = {
  name: {'ui:widget': TextWidget},
  organization: {'ui:widget': SelectWidget, 'ui:disabled': true},
  externalId: {'ui:widget': TextWidget}
}

class EditChannel extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      organizations: []
    }
  }

  componentWillMount () {
    this.loadOrgs()
  }

  async loadOrgs () {
    var url = '/admin/organizations/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      organizations: body.data
    })

    this.setOrg()
  }

  setOrg () {
    var pos = this.state.organizations.findIndex(e => {
      return (
        String(e._id) === String(this.state.formData.organization)
      )
    })

    this.setState({
      ...this.state.formData.organization = this.state.organizations[pos].uuid
    })
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
    formData.isDefault = undefined
    try {
      var data = await api.post(this.props.url, formData)
      if (this.props.load) {
        await this.props.load()
      }
      this.clearState()
      this.setState({...this.state, apiCallMessage: 'message is-success'})
      if (this.props.finishUp) this.props.finishUp(data.data)
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

    let org = schema.properties.organization

    org.enum = this.state.organizations.map(item => { return item.uuid })
    org.enumNames = this.state.organizations.map(item => { return item.name })

    return (<div>
      <BaseForm schema={schema}
        uiSchema={uiSchema}
        formData={this.state.formData}
        onChange={(e) => { this.changeHandler(e) }}
        onSubmit={(e) => { this.submitHandler(e) }}
        onError={(e) => { this.errorHandler(e) }}>
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
    </div>)
  }
}

export default EditChannel
