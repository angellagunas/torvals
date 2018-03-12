import React, { Component } from 'react'

import BaseModal from '~base/components/base-modal'
import AdjustmentRequestForm from './create-adjustmentRequest-form'

class CreateAdjustmentRequest extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isLoading: ''
    }
    this.hideModal = this.props.hideModal.bind(this)
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finish (res) {
    this.setState({ isLoading: '' })
    this.props.finishUp(res)
  }
  render () {
    if (!this.props.prediction) {
      return (<div />)
    }

    return (
      <BaseModal
        title='Crear Solicitud de Ajuste'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <AdjustmentRequestForm
          url={`${this.props.baseUrl}${this.props.prediction.uuid}/request`}
          finishUp={(res) => this.finish(res)}
          initialState={{newAdjustment: this.props.prediction.localAdjustment}}
          prediction={this.props.prediction}
          submitHandler={(data) => this.submitHandler(data)}
          errorHandler={(data) => this.errorHandler(data)}
        >
          <div className='field is-grouped'>
            <div className='control'>
              <button
                className={'button is-primary ' + this.state.isLoading}
                disabled={!!this.state.isLoading}
                type='submit'>
                Crear
              </button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal} type='button'>Cancelar</button>
            </div>
          </div>
        </AdjustmentRequestForm>
      </BaseModal>
    )
  }
}

export default CreateAdjustmentRequest
