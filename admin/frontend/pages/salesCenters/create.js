import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'

import BaseModal from '~base/components/base-modal'
import SalesCenterForm from './create-form'

var initialState = {
  name: '',
  description: ''
}

class CreateSalesCenter extends Component {
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
        title='Create Sales Center'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <SalesCenterForm
          baseUrl='/admin/salesCenters'
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
        </SalesCenterForm>
      </BaseModal>
    )
  }
}

CreateSalesCenter.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreateSalesCenter = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreateSalesCenter)

export default BranchedCreateSalesCenter
