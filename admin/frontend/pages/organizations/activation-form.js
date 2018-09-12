import React, { Component } from 'react'
import moment from 'moment'

import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  EmailWidget,
  DateWidget,
  TextareaWidget
} from '~base/components/base-form'

const schema = {
  type: 'object',
  title: '',
  required: [
    'name', 'email', 'phone', 'billingStart', 'billingEnd'
  ],
  properties: {
    name: {type: 'string', title: 'Nombre'},
    email: {type: 'string', title: 'Email'},
    phone: {type: 'string', title: 'Teléfono'},
    billingStart: {type: 'string', title: 'Fecha de incio de facturación'},
    billingEnd: {type: 'string', title: 'Fecha de termino de facturación'},
    observation: {type: 'string', title: 'Observación'}
  }
}

const uiSchema = {
  name: {'ui:widget': TextWidget},
  email: {'ui:widget': EmailWidget},
  phone: {'ui:widget': TextWidget},
  billingStart: {'ui:widget': DateWidget},
  billingEnd: {'ui:widget': DateWidget},
  observation: {'ui:widget': TextareaWidget}
}

class OrganizationActivationForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        name: this.props.initialState.salesRep.name,
        email: this.props.initialState.salesRep.email,
        phone: this.props.initialState.salesRep.phone
      },
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
    try {
      var data = await api.post(this.props.url, {...formData})
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
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    let status = {
      active: 'Activa',
      inactive: 'Inactiva',
      trial: 'Período de prueba',
      activationPending: 'Pendiente de activación'
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

export default OrganizationActivationForm
