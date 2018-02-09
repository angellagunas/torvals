import React, { Component } from 'react'

import BaseModal from '~base/components/base-modal'
import AdjustmentRequestForm from './create-adjustmentRequest-form'

class CreateAdjustmentRequest extends Component {
  constructor (props) {
    super(props)

    this.hideModal = this.props.hideModal.bind(this)
  }

  render () {
    if (!this.props.prediction) {
      return (<div />)
    }

    return (
      <BaseModal
        title='Crear Pedido de Ajuste'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <AdjustmentRequestForm
          url={`${this.props.baseUrl}${this.props.prediction.uuid}/request`}
          finishUp={this.props.finishUp}
          initialState={{newAdjustment: this.props.prediction.adjustment}}
          prediction={this.props.prediction}
        >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary' type='submit'>Crear</button>
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
