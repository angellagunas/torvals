import React, { Component } from 'react'
import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  TextareaWidget,
  SelectWidget
} from '~base/components/base-form'

class ProjectForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      organizations: []
    }

    this.schema = {
      type: 'object',
      title: '',
      required: [
        'name'
      ],
      properties: {
        name: {type: 'string', title: 'Nombre'},
        description: {type: 'string', title: 'Descripción'}
      }
    }

    this.uiSchema = {
      name: {'ui:widget': TextWidget},
      description: {'ui:widget': TextareaWidget, 'ui:rows': 3}
    }
  }

  componentWillMount () {
    if (this.props.setAlert) { this.props.setAlert('is-white', ' ') }
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
    if (this.props.submitHandler) this.props.submitHandler(formData)
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
    let { canEdit } = this.props
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    let { editable } = this.props

    if (editable) {
      this.uiSchema['status'] = {'ui:widget': SelectWidget, 'ui:disabled': true}
      this.schema.properties['status'] = {
        type: 'string',
        title: 'Estado',
        enum: [
          'new',
          'empty',
          'adjustment',
          'uploading',
          'uploaded',
          'preprocessing',
          'configuring',
          'processing',
          'reviewing',
          'ready',
          'conciliated',
          'pendingRows',
          'error',
          'cloning'
        ],
        enumNames: [
          'Nuevo',
          'Sin datos',
          'Ajuste',
          'Cargando',
          'Cargado',
          'Preprocesando',
          'Configurando',
          'Procesando',
          'Revisando',
          'Listo',
          'Conciliado',
          'Pendiente',
          'Error',
          'Clonando'
        ]
      }
      this.uiSchema['showOnDashboard'] = {'ui:widget': SelectWidget}
      this.schema.properties['showOnDashboard'] = {
        type: 'boolean',
        title: 'Primario (Mostrar en dashboard)',
        default: false,
        enum: [
          true,
          false
        ],
        enumNames: [
          'Si',
          'No'
        ]
      }
    } else {
      delete this.uiSchema['status']
      delete this.schema.properties['status']
      delete this.uiSchema['showOnDashboard']
      delete this.schema.properties['showOnDashboard']
    }
    if (!canEdit) {
      this.uiSchema.name['ui:disabled'] = true
      this.uiSchema.description['ui:disabled'] = true
      if (this.uiSchema.status) this.uiSchema.status['ui:disabled'] = true
    } else {
      delete this.uiSchema.name['ui:disabled']
      delete this.uiSchema.description['ui:disabled']
      if (this.uiSchema.status) delete this.uiSchema.status['ui:disabled']
    }

    if (this.uiSchema.status) this.uiSchema.status['ui:disabled'] = true
    if (this.state.formData.cycleStatus) {
      this.uiSchema['cycleStatus'] = {'ui:widget': TextWidget, 'ui:disabled': true}
      this.schema.properties['cycleStatus'] = {
        type: 'string',
        title: 'Etapa actual del ciclo'
      }
    }
    return (
      <div>
        <BaseForm schema={this.schema}
          uiSchema={this.uiSchema}
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
          {canEdit && this.props.children}
        </BaseForm>
      </div>
    )
  }
}

export default ProjectForm
