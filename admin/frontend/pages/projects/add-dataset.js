import React, { Component } from 'react'
import api from '~base/api'

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
    this.state = {
      datasets: [],
      loaded: false
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    let { project } = this.props
    const body = await api.get(
      '/admin/datasets',
      {
        start: 0,
        limit: 0,
        organization: project.organization.uuid,
        project: project.uuid
      }
    )

    this.setState({
      datasets: body.data,
      loaded: true
    })
  }

  render () {
    console.log(this.state)

    if (!this.state.loaded) {
      return <Loader />
    }

    return (
      <BaseModal
        title='Add dataset'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <DatasetForm
          baseUrl={`/admin/projects/${this.props.project.uuid}/add/dataset`}
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={initialState}
          datasets={this.state.datasets}
        >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary'>Add</button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal}>Cancel</button>
            </div>
          </div>
        </DatasetForm>
      </BaseModal>
    )
  }
}

export default AddDataset
