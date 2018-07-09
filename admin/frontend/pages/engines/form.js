import React, { Component } from 'react'

import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  TextareaWidget
} from '~base/components/base-form'

const schema = {
  type: 'object',
  title: '',
  required: [
    'name',
    'path',
    'instructions'
  ],
  properties: {
    name: {type: 'string', title: 'Nombre'},
    path: {type: 'number', title: 'Ruta'},
    description: {type: 'string', title: 'Descripción'},
    instructions: {type: 'number', title: 'Instrucciones'}
  }
}

const uiSchema = {
  name: { 'ui:widget': TextWidget, 'ui:disabled': true },
  path: { 'ui:widget': TextWidget, 'ui:disabled': true },
  description: { 'ui:widget': TextareaWidget, 'ui:rows': 2 },
  instructions: { 'ui:widget': TextareaWidget, 'ui:rows': 3, 'ui:disabled': true }
}

class EngineForm extends Component {
  constructor (props) {
    super(props)

    this.state = {
      formData: this.props.initialState,
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

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  async submitHandler ({formData}) {
    formData.isDefault = undefined
    if (this.props.submitHandler) this.props.submitHandler(formData)
    try {
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
    let error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    if (this.state.formData.slug === 'default') {
      uiSchema.name['ui:disabled'] = true
    }

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

export default EngineForm
