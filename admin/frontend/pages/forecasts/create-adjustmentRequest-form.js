import React, { Component } from 'react'

import api from '~base/api'

import {
  BaseForm,
  TextWidget
} from '~base/components/base-form'

const schema = {
  type: 'object',
  title: '',
  required: [
    'newAdjustment'
  ],
  properties: {
    newAdjustment: {type: 'string', title: 'Ajuste'}
  }
}

const uiSchema = {
  newAdjustment: {'ui:widget': TextWidget}
}

class AdjustmentRequestForm extends Component {
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
    formData.newAdjustment = formData.newAdjustment.replace(/[^(\-|\+)?][^0-9.]/g, '')

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
    formData.newAdjustment = Number(formData.newAdjustment.replace(/[^(\-|\+)?][^0-9.]/g, ''))
    if (this.props.submitHandler) this.props.submitHandler(formData)
    try {
      await api.post(this.props.url, formData)
      this.clearState()
      this.setState({...this.state, apiCallMessage: 'message is-success'})
      if (this.props.finishUp) this.props.finishUp()
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

export default AdjustmentRequestForm
