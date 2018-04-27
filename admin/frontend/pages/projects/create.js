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
      organizations: [],
      isLoading: ''
    }
  }

  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  render () {
    return (
      <BaseModal
        title='Crear Proyecto'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <ProjectForm
          baseUrl='/admin/projects'
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={initialState}
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
