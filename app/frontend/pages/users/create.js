import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Loader from '~base/components/spinner'

import env from '~base/env-variables'
import api from '~base/api'
import BaseModal from '~base/components/base-modal'
import PasswordUserForm from './password-form'
import InviteUserForm from './send-invite-form'

class CreateUser extends Component {
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

  async load () {
    const body = await api.get(
      '/app/users',
      {
        start: 0,
        limit: this.cursor.get('pageLength') || 10,
        ...this.props.filters || ''
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

  async loadRoles () {
    var url = '/app/roles/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      roles: body.data,
      loadingRoles: false
    })
  }

  getPasswordForm () {
    return (
      <PasswordUserForm
        baseUrl='/app/users'
        url={this.props.url}
        initialState={this.initialState}
        load={this.load.bind(this)}
        roles={this.state.roles || []}
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
                id="profile.btnCreate"
                defaultMessage={`Crear`}
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
                id="profile.btnCancel"
                defaultMessage={`Cancelar`}
              />
            </button>
          </div>
        </div>
      </PasswordUserForm>
    )
  }

  getSendInviteForm () {
    return (
      <InviteUserForm
        baseUrl='/app/users'
        url={this.props.url}
        initialState={this.initialState}
        load={this.load.bind(this)}
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
                id="profile.btnInvite"
                defaultMessage={`Invitar`}
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
                id="profile.btnCancel"
                defaultMessage={`Cancelar`}
              />
            </button>
          </div>
        </div>
      </InviteUserForm>
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
    var title = 'Crear usuario' //TODO: translate

    this.initialState = {
      name: '',
      email: '',
      password_1: '',
      password_2: ''
    }

    if (!this.state.loadingRoles) {
      var defaultRole = this.state.roles.find(item => {
        return item.isDefault === true
      })

      if (defaultRole) {
        this.initialState.role = defaultRole._id
      }

      if (env.EMAIL_SEND) {
        modalContent = this.getSendInviteForm()
        title = 'Invitar usuario' //TODO: translate
      } else {
        modalContent = this.getPasswordForm()
      }
    } else {
      modalContent = <Loader />
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

CreateUser.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreateUser = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreateUser)

export default BranchedCreateUser
