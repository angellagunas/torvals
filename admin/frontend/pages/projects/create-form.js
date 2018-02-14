import React, { Component } from 'react'
import Loader from '~base/components/spinner'
import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  TextareaWidget,
  SelectWidget
} from '~base/components/base-form'

const schema = {
  type: 'object',
  title: '',
  required: [
    'name',
    'organization'
  ],
  properties: {
    name: {type: 'string', title: 'Nombre'},
    organization: {
      type: 'string',
      title: 'Organización',
      enum: [],
      enumNames: []
    },
    description: {type: 'string', title: 'Descripción'}
  }
}

const uiSchema = {
  name: {'ui:widget': TextWidget},
  organization: {'ui:widget': SelectWidget},
  description: {'ui:widget': TextareaWidget, 'ui:rows': 3}
}

class ProjectForm extends Component {
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
    try {
      var data = await api.post(this.props.url, formData)
      if (this.props.load) {
        await this.props.load()
      }
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
    let { editable } = this.props

    if (editable) {
      uiSchema['status'] = {'ui:widget': SelectWidget}
      schema.properties['status'] = {
        type: 'string',
        title: 'Status',
        enum: [
          'empty',
          'processing',
          'ready',
          'adjustment',
          'reviewing',
          'pendingRows',
          'adjustment',
          'conciliating'
        ],
        enumNames: [
          'empty',
          'processing',
          'ready',
          'adjustment',
          'reviewing',
          'pendingRows',
          'adjustment',
          'conciliating'
        ]
      }
    } else {
      delete uiSchema['status']
      delete schema.properties['status']
    }
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

    return (
      <div>
        <BaseForm schema={schema}
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

export default ProjectForm
