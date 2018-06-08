import React, { Component } from 'react'

import Loader from '~base/components/spinner'
import BaseModal from '~base/components/base-modal'
import DatasetForm from './dataset-form'

var initialState = {
  name: '',
  description: ''
}

class AddDataset extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
  }

  async loadBoth () {
    await this.props.load()
    await this.props.loadDatasets()
  }

  render () {
    if (!this.props.datasets) {
      return <Loader />
    }

    return (
      <BaseModal
        title='Add dataset'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <DatasetForm
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={initialState}
          datasets={this.props.datasets}
          load={this.loadBoth.bind(this)}
        >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary' type='submit'>Agregar</button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal} type='button'>Cancelar</button>
            </div>
          </div>
        </DatasetForm>
      </BaseModal>
    )
  }
}

export default AddDataset
