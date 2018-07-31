import React, { Component } from 'react'
import moment from 'moment'

import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  NumberWidget,
  TextareaWidget,
  EmailWidget,
  SelectWidget,
  FileWidget
} from '~base/components/base-form'

const schema = {
  type: 'object',
  title: '',
  required: [
    'name', 'slug'
  ],
  properties: {
    name: {type: 'string', title: 'Nombre'},
    slug: {type: 'string', title: 'Slug'},
    country: {type: 'string', title: 'País'},
    status: {type: 'string', title: 'Status'},
    employees: {type: 'number', title: 'No. Empleados'},
    rfc: {type: 'string', title: 'RFC'},
    billingEmail: {type: 'string', title: 'Email de facturación'},
    businessName: {type: 'string', title: 'Nombre fiscal'},
    businessType: {type: 'string', title: 'Giro'},
    trialStart: {type: 'string', title: 'Fecha de inicio de período de prueba'},
    trialEnd: {type: 'string', title: 'Fecha en que culmina el período de prueba'},
    billingStart: {type: 'string', title: 'Fecha de incio de facturación'},
    billingEnd: {type: 'string', title: 'Fecha de termino de facturación'},
    description: {type: 'string', title: 'Descripción'},
    profile: {type: 'string', title: 'Imagen', format: 'data-url'}
  }
}

const uiSchema = {
  name: {'ui:widget': TextWidget},
  slug: {'ui:widget': TextWidget, 'ui:disabled': true},
  country: {'ui:widget': TextWidget},
  status: {'ui:widget': TextWidget, 'ui:disabled': true},
  employees: {'ui:widget': NumberWidget},
  rfc: {'ui:widget': TextWidget},
  billingEmail: {'ui:widget': EmailWidget},
  businessName: {'ui:widget': TextWidget},
  businessType: {'ui:widget': TextWidget},
  trialStart: {'ui:widget': TextWidget, 'ui:disabled': true},
  trialEnd: {'ui:widget': TextWidget, 'ui:disabled': true},
  billingStart: {'ui:widget': TextWidget, 'ui:disabled': true},
  billingEnd: {'ui:widget': TextWidget, 'ui:disabled': true},
  description: {'ui:widget': TextareaWidget, 'ui:rows': 3},
  profile: {'ui:widget': FileWidget}
}

class OrganizationForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      initialState: this.props.initialState,
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }
  }

  componentWillReceiveProps (nextProps) {
    if (JSON.stringify(this.props.initialState) !== JSON.stringify(nextProps.initialState)) {
      this.setState({
        initialState: nextProps.initialState,
        formData: nextProps.initialState,
        apiCallMessage: 'is-hidden',
        apiCallErrorMessage: 'is-hidden'
      })
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
    if (formData.slug !== this.state.initialState.slug && !this.state.confirmed) {
      return this.setState({
        ...this.state,
        error: 'Si modificas el slug, se cerrará la sesión de todos los usuarios que hayan iniciado sesión en esta organización. Si REALMENTE desea continuar, haga clic en guardar de nuevo',
        apiCallErrorMessage: 'message is-danger',
        confirmed: true
      })
    }
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
    var data = {...this.state.formData}
    data.status = status[data.status]
    if (this.props.initialState.trialStart) data.trialStart = moment.utc(this.props.initialState.trialStart).local().format('DD-MM-YYYY h:mm A')
    if (this.props.initialState.trialEnd) data.trialEnd = moment.utc(this.props.initialState.trialEnd).local().format('DD-MM-YYYY h:mm A')
    if (this.props.initialState.billingStart) data.billingStart = moment.utc(this.props.initialState.billingStart).local().format('DD-MM-YYYY h:mm A')
    if (this.props.initialState.billingEnd) data.billingEnd = moment.utc(this.props.initialState.billingEnd).local().format('DD-MM-YYYY h:mm A')

    return (
      <div>
        <BaseForm schema={schema}
          uiSchema={uiSchema}
          formData={data}
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

export default OrganizationForm
