import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'

import BaseModal from '~base/components/base-modal'
import ProjectForm from './create-form'

var initialState = {
  name: '',
  description: ''
}

class CreateProject extends Component {
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
        title='Create Project'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <ProjectForm
          baseUrl='/admin/projects'
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={initialState}
        >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary' type='submit'>Create</button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal} type='button'>Cancel</button>
            </div>
          </div>
        </ProjectForm>
      </BaseModal>
    )
  }
}

CreateProject.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreateProject = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreateProject)

export default BranchedCreateProject
