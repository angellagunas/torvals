import React, { Component } from 'react'
import api from '~base/api'
import Loader from '~base/components/spinner'

import {
  BaseForm,
  SelectWidget
} from '~base/components/base-form'

const schema = {
  type: 'object',
  title: '',
  required: [
    'isDate',
    'analyze'
  ],
  properties: {
    'isDate': {
      type: 'string',
      title: 'is Date',
      enum: [],
      enumNames: []
    },
    'analyze': {
      type: 'string',
      title: 'is Analize',
      enum: [],
      enumNames: []
    }
  }
}

const uiSchema = {
  'isDate': {'ui:widget': SelectWidget},
  'analyze': {'ui:widget': SelectWidget}
}

class ConfigureDatasetForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: this.props.formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    this.setState({
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
  }

  async submitHandler ({formData}) {
    try {
      var response = await api.post(this.props.url, formData)
      this.clearState()
      this.setState({...this.state, apiCallMessage: 'message is-success'})
      this.props.changeHandler(response.data)
    } catch (e) {
      return this.setState({
        ...this.state,
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  render () {
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    if (this.props.columns.length === 0) {
      return <Loader />
    }

    schema.properties.isDate.enum = this.props.columns.map(item => { return item.name })
    schema.properties.isDate.enumNames = this.props.columns.map(item => { return item.name })
    schema.properties.analyze.enum = this.props.columns.map(item => { return item.name })
    schema.properties.analyze.enumNames = this.props.columns.map(item => { return item.name })

    return (
      <div>
        <BaseForm schema={schema}
          uiSchema={uiSchema}
          formData={this.state.inititalState}
          onSubmit={(e) => { this.submitHandler(e) }}
          onError={(e) => { this.errorHandler(e) }}
        >
          <div className={this.state.apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>
                The dataSet has been configured successfuly
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

export default ConfigureDatasetForm
