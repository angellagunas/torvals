import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'

import BaseModal from '~base/components/base-modal'
import CreateDatasetForm from './create-dataset-form'

var initialState = {
  name: '',
  description: '',
  organization: '',
  project: ''
}

class CreateDataSet extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
    initialState.organization = this.props.organization
    initialState.project = this.props.project
  }

  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
  }

  async load () {
    const body = await api.get(
      '/app/datasets',
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

  render () {
    return (
      <BaseModal
        title='Create DataSet'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <CreateDatasetForm
          baseUrl='/app/datasets'
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={initialState}
          load={this.load.bind(this)}
        >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary' type='submit'>Create</button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal} type='button'>Cancel</button>
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
