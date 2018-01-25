import React, { Component } from 'react'
import BaseModal from '~base/components/base-modal'
import {BaseForm, TextWidget} from '~base/components/base-form'
import api from '~base/api'

const schema = {
  type: 'object',
  title: '',
  required: [
    'uuid'
  ],
  properties: {
    uuid: {type: 'string', title: 'UUID'}
  }
}

const uiSchema = {
  uuid: {'ui:widget': TextWidget}
}

var initialState = {
  uuid: '',
  project: ''
}

class AddExternalDataset extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      formData: initialState,
      apiMessage: 'is-hidden',
      apiErrorMessage: 'is-hidden',
      notificationClass: 'is-hidden'
    }
    initialState.project = this.props.project.uuid
  }

  showModal = () => {
    this.setState({
      className: ' is-active'
    })
  }

  hideModal = () => {
    this.setState({
      className: ''
    })
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    this.setState({
      formData,
      apiMessage: 'is-hidden',
      apiErrorMessage: 'is-hidden'
    })
  }

  clearState () {
    this.setState({
      formData: initialState,
      apiMessage: 'is-hidden',
      apiErrorMessage: 'is-hidden'
    })
  }

  async addExternal (item) {
    let data
    try {
      data = await api.post('/admin/datasets/addExternal', item)
      this.clearState()
      this.setState({...this.state, apiMessage: 'message is-success'})
      await this.props.load()
      setTimeout(() => {
        this.clearState()
        this.hideModal()
      }, 1500)
    } catch (e) {
      return this.setState({
        ...this.state,
        error: e.message,
        apiErrorMessage: 'message is-danger'
      })
    }
  }

  render () {
    return (
      <div>
        <button className='button is-info' onClick={() => this.showModal()}>
          <span className='icon'>
            <i className='fa fa-plus-circle' />
          </span>
          <span>
            Agregar por UUID
          </span>
        </button>
        <BaseModal
          title='Agregar Dataset Externo'
          className={this.state.className}
          hideModal={this.hideModal}
        >
          <BaseForm
            schema={schema}
            uiSchema={uiSchema}
            formData={this.state.formData}
            onChange={(e) => { this.changeHandler(e) }}
            onSubmit={(e) => { this.addExternal(e.formData) }}
            onError={(e) => { this.errorHandler(e) }}
          >
            <div className={this.state.apiErrorMessage}>
              <div className='message-body is-size-7 has-text-centered'>
                {this.state.error}
              </div>
            </div>
            <div className={this.state.apiMessage}>
              <div className='message-body is-size-7 has-text-centered'>
                Dataset agregado correctamente
              </div>
            </div>

            <div className='field is-grouped'>
              <div className='control'>
                <button className='button is-primary' type='submit'>Agregar</button>
              </div>
              <div className='control'>
                <button className='button' type='button' onClick={this.hideModal}>Cancelar</button>
              </div>
            </div>
          </BaseForm>
        </BaseModal>
      </div>
    )
  }
}

export default AddExternalDataset
