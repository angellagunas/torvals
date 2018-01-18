import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'

import BaseModal from '~base/components/base-modal'
import ProductForm from './create-form'

var initialState = {
  name: '',
  description: '',
  organizations: []
}

class CreateProduct extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
    this.state = {
      organizations: []
    }
  }

  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
  }

  render () {
    return (
      <BaseModal
        title='Create Product'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <ProductForm
          baseUrl='/admin/products'
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={initialState}

        >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary'>Create</button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal} type='button'>Cancel</button>
            </div>
          </div>
        </ProductForm>
      </BaseModal>
    )
  }
}

CreateProduct.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreateProduct = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreateProduct)

export default BranchedCreateProduct
