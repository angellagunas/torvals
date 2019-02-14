import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Loader from '~base/components/spinner'

import env from '~base/env-variables'
import api from '~base/api'
import BaseModal from '~base/components/base-modal'
import PasswordUserForm from './password-form'
import InviteUserFormEmail from './send-invite-form-email'

class CreateSendEmail extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
    this.state = {
      roles: [],
      isLoading: '',
      loadingRoles: true
    }
  }

  async componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
    await this.loadRoles()
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }



  getSendInviteForm () {
    return (
      <InviteUserFormEmail
        baseUrl='/app/users/'
        url={this.props.url}
        initialState={this.initialState}

        //load={this.load.bind(this)}
        roles={this.state.roles}
        filters={this.props.filters}
        finishUp={(data) => {
          this.finishUpHandler(data)
          if (this.props.finishUp) this.props.finishUp(data)
        }}
        submitHandler={(data) => this.submitHandler(data)}
        errorHandler={(data) => this.errorHandler(data)}
      >
        <div className='field is-grouped'>
          <div className='control'>
            <button
              className={'button is-primary ' + this.state.isLoading}
              disabled={!!this.state.isLoading}
              type='submit'
            >
              <FormattedMessage
                id='user.btnSendEmail'
                //defaultMessage={`'Enviar Correo'`}
              />
            </button>
          </div>
          <div className='control'>
            <button
              className='button'
              onClick={this.hideModal}
              type='button'
            >
              <FormattedMessage
                id='user.btnCancel'
                defaultMessage={`Cancelar`}
              />
            </button>
          </div>
        </div>
      </InviteUserFormEmail>
    )
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finishUpHandler () {
    this.setState({ isLoading: '' })
  }

  render () {
    var modalContent
    var title = this.formatTitle('user.sendEmail')

    this.initialState = {
      name: '',
      email: '',
      body: '',
      subject: ''
    }

    if (env.EMAIL_SEND) {
      modalContent = this.getSendInviteForm()
      title = this.formatTitle('user.sendEmail')
  }

    return (
      <BaseModal
        title={title}
        className={this.props.className}
        hideModal={this.hideModal}
      >
        {modalContent}
      </BaseModal>
    )
  }
}

CreateSendEmail.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreateUser = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreateSendEmail)

export default injectIntl(BranchedCreateUser)
