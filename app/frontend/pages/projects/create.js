import React, { Component } from 'react'
import { injectIntl } from 'react-intl'
import BaseModal from '~base/components/base-modal'
import ProjectForm from './create-form'

class CreateProject extends Component {
  constructor(props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
    this.state = {
      organizations: [],
      isLoading: ''
    }
    this.initialState = {
      name: '',
      description: ''
    }

    if (props.initialState) {
      this.initialState = props.initialState
    }
  }

  submitHandler() {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler() {
    this.setState({ isLoading: '' })
  }

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  render() {
    return (
      <BaseModal
        title={this.formatTitle(this.props.title) || 'Crear Proyecto'}
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <ProjectForm
          refresh={this.props.refresh}
          baseUrl={this.props.baseUrl}
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={this.initialState}
          canEdit={this.props.canEdit}
          submitHandler={(data) => this.submitHandler(data)}
          errorHandler={(data) => this.errorHandler(data)}
        >
          <div className='field is-grouped'>
            <div className='control'>
              <button
                className={'button is-primary ' + this.state.isLoading}
                disabled={!!this.state.isLoading}
                type='submit'
              >{this.props.buttonText || this.formatTitle('dashboard.noProjectsBtn')}</button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal} type='button'>
                {this.formatTitle('projectConfig.cancel')}
              </button>
            </div>
          </div>
        </ProjectForm>
      </BaseModal>
    )
  }
}

export default injectIntl(CreateProject)
