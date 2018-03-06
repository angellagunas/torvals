import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'

import BaseModal from '~base/components/base-modal'
import PriceForm from './create-form'

var initialState = {
  price: '',
  product: '',
  channel: '',
  dateCreated: '',
  uuid: ''
}

class CreatePrice extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
  }

  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
  }

  render () {
    return (
      <BaseModal
        title='Crear Precio'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <PriceForm
          baseUrl='/admin/prices'
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={initialState}

        >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary'>Create</button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal}>Cancel</button>
            </div>
          </div>
        </PriceForm>
      </BaseModal>
    )
  }
}

CreatePrice.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreatePrice = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreatePrice)

export default BranchedCreatePrice
