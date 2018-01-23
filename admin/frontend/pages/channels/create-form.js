import React, { Component } from 'react'
import Loader from '~base/components/spinner'
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
    'organization',
    'externalId'
  ],
  properties: {
    name: {type: 'string', title: 'Nombre'},
    organization: {
      type: 'string',
      title: 'Organización',
      enum: [],
      enumNames: []
    },
    externalId: {type: 'string', title: 'Id Externo'}
  }
}

const uiSchema = {
  name: {'ui:widget': TextWidget},
  organization: {'ui:widget': SelectWidget},
  externalId: {'ui:widget': TextWidget}
}

class ChannelForm extends Component {
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
    var url = '/admin/organizations'
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

    if (this.state.organizations.length === 0) {
      return <Loader />
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

export default ChannelForm
