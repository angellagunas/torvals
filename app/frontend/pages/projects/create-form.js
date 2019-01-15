import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import api from '~base/api'
import tree from '~core/tree'

import {
  BaseForm,
  TextWidget,
  NumberWidget,
  TextareaWidget,
  SelectWidget,
  DateWidget
} from '~base/components/base-form'

const status = [
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
  'cloning',
  'updating-rules',
  'pending-configuration'
]

const statusName = [
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
  'Clonando',
  'Actualizando reglas',
  'Configuración pendiente'
]

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
        name: {type: 'string', title: this.formatTitle('projectConfig.name')},
        description: { type: 'string', title: this.formatTitle('projectConfig.description')}
      }
    }

    this.uiSchema = {
      name: {'ui:widget': TextWidget},
      description: {'ui:widget': TextareaWidget, 'ui:rows': 3}
    }
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
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

  async updateStep () {
    try {
      let user = tree.get('user')
      if (user.currentOrganization.wizardSteps.project) {
        return
      }
      let url = '/app/organizations/' + user.currentOrganization.uuid + '/step'

      let res = await api.post(url, {
        step: {
          name: 'project',
          value: true
        }
      })

      if (res) {
        let me = await api.get('/user/me')
        tree.set('user', me.user)
        tree.set('organization', me.user.currentOrganization)
        tree.set('rule', me.rule)
        tree.set('role', me.user.currentRole)
        tree.set('loggedIn', me.loggedIn)
        tree.commit()
        return true
      } else {
        return false
      }
    } catch (e) {
      console.log(e)
      return false
    }
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
      await this.updateStep()

      if (this.props.refresh) {
        window.location.reload(false)
      }
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

  render() {
    let { canEdit } = this.props
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    let { editable } = this.props

    if (editable) {
      this.uiSchema['status'] = {'ui:widget': SelectWidget, 'ui:disabled': !this.props.isAdmin}
      this.schema.properties['status'] = {
        type: 'string',
        title: this.formatTitle('projectConfig.status'),
        enum: status,
        enumNames: this.formatTitle('dates.locale') === 'en' ? status : statusName
      }
      this.uiSchema['showOnDashboard'] = {'ui:widget': SelectWidget}
      this.schema.properties['showOnDashboard'] = {
        type: 'boolean',
        title: this.formatTitle('projectConfig.primary'),
        default: false,
        enum: [
          true,
          false
        ],
        enumNames: [
          this.formatTitle('projectConfig.yes'),
          this.formatTitle('projectConfig.no')
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
      if (this.uiSchema.status) this.uiSchema.status['ui:disabled'] = !this.props.isAdmin
    } else {
      delete this.uiSchema.name['ui:disabled']
      delete this.uiSchema.description['ui:disabled']
      if (this.uiSchema.status) delete this.uiSchema.status['ui:disabled']
    }

    if (this.uiSchema.status) this.uiSchema.status['ui:disabled'] = !this.props.isAdmin
    if (this.state.formData.cycleStatus) {
      this.uiSchema['cycleStatus'] = {'ui:widget': SelectWidget, 'ui:disabled': !this.props.isAdmin }
      this.schema.properties['cycleStatus'] = {
        type: 'string',
        title: this.formatTitle('projectConfig.cycleStatus'),
        enum: [
          'empty',
          'consolidation',
          'forecastCreation',
          'rangeAdjustmentRequest',
          'rangeAdjustment',
          'salesUpload'
        ],
        enumNames: [
          'empty',
          'consolidation',
          'forecastCreation (close)',
          'rangeAdjustmentRequest',
          'rangeAdjustment (open)',
          'salesUpload'
        ]
      }
      this.uiSchema['cycleType'] = {'ui:widget': SelectWidget, 'ui:disabled': !this.props.isAdmin }
      this.schema.properties['cycleType'] = {
        type: 'string',
        title: 'Configuración de dias',
        default: 'add',
        enum: [
          'add',
          'subtract'
        ],
        enumNames: [
          'Agregar',
          'Remover'
        ]
      }
      this.uiSchema['cycleTypeValue'] = {'ui:widget': NumberWidget, 'ui:disabled': !this.props.isAdmin }
      this.schema.properties['cycleTypeValue'] = {
        type: 'number',
        default: 6,
        title: 'Dias'
      }

      this.uiSchema['mainDatasetV'] = {'ui:widget': TextWidget, 'ui:disabled': !this.props.isAdmin }
      this.schema.properties['mainDatasetV'] = {
        type: 'string',
        title: 'Dataset principal'
      }
      this.uiSchema['activeDatasetV'] = {'ui:widget': TextWidget, 'ui:disabled': !this.props.isAdmin }
      this.schema.properties['activeDatasetV'] = {
        type: 'string',
        title: 'Dataset activo'
      }

      this.uiSchema['timerStart'] = {'ui:widget': DateWidget, 'ui:disabled': !this.props.isAdmin }
      this.schema.properties['timerStart'] = {
        type: 'string',
        title: 'Inicio del timer'
      }
      this.uiSchema['timerEnd'] = {'ui:widget': DateWidget, 'ui:disabled': !this.props.isAdmin }
      this.schema.properties['timerEnd'] = {
        type: 'string',
        title: 'FInal del timer'
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
              <FormattedMessage
                id='projectConfig.saved'
                defaultMessage={`Los datos se han guardado correctamente`}
              />
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

export default injectIntl(ProjectForm)
