import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import Loader from '~base/components/spinner'
import api from '~base/api'

import {
  BaseForm,
  TextWidget
} from '~base/components/base-form'

const schema = {
  type: 'object',
  title: '',
  required: [],
  properties: { //TODO: translate
    price: {type: 'string', title: 'Precio'},
    product: {type: 'string', title: 'Producto'},
    channel: {type: 'string', title: 'Canal'}
  }
}

const uiSchema = {
  price: {'ui:widget': TextWidget},
  product: {'ui:widget': TextWidget, 'ui:disabled': true},
  channel: {'ui:widget': TextWidget, 'ui:disabled': true}
}

class PriceForm extends Component {
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
    if (isNaN(formData.price)) {
      return this.setState({
        ...this.state, //TODO: translate
        error: 'Precio tiene que ser un valor numérico',
        apiCallErrorMessage: 'message is-danger'
      })
    }
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

    if (this.props.disabled) {
      for (var field in uiSchema) {
        uiSchema[field]['ui:disabled'] = true
      }
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
              <FormattedMessage
                id="prices.savedMsg"
                defaultMessage={`Los datos se han guardado correctamente`}
              />
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

export default PriceForm
