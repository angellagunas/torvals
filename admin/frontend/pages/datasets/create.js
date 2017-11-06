import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'

import BaseModal from '~base/components/base-modal'
import CreateDatasetForm from './create-form'

var initialState = {
  name: '',
  description: '',
  organization: ''
}

class CreateDataSet extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
  }

  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
    this.loadOrgs()
  }

  async load () {
    const body = await api.get(
      '/admin/datasets',
      {
        start: 0,
        limit: this.cursor.get('pageLength') || 10
      }
    )

    this.cursor.set({
      page: 1,
      totalItems: body.total,
      items: body.data,
      pageLength: this.cursor.get('pageLength') || 10
    })
    this.context.tree.commit()
  }

  async loadOrgs () {
    var url = '/admin/organizations/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      organization: body.data
    })
  }

  render () {
    return (
      <BaseModal
        title='Create DataSet'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <CreateDatasetForm
          baseUrl='/admin/organizations'
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={initialState}
          load={this.load.bind(this)}
        >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary'>Create</button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal}>Cancel</button>
            </div>
          </div>
        </CreateDatasetForm>
      </BaseModal>
    )
  }
}

CreateDataSet.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreateDataSet = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreateDataSet)

export default BranchedCreateDataSet
