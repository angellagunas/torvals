import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'

import env from '~base/env-variables'
import api from '~base/api'
import BaseModal from '~base/components/base-modal'
import PasswordUserForm from './password-form'
import InviteUserForm from './send-invite-form'

var initialState = {
  name: '',
  email: '',
  password_1: '',
  password_2: ''
}

class CreateUser extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
    this.state = {
      roles: [],
      orgs: []
    }
    initialState['organization'] = this.props.organization || ''
  }

  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
    this.loadRoles()
    this.loadOrgs()
  }

  async load () {
    const body = await api.get(
      '/admin/users',
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
    var url = '/admin/roles/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      roles: body.data
    })
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
      orgs: body.data
    })
  }

  getPasswordForm () {
    return (
      <PasswordUserForm
        baseUrl='/admin/users'
        url={this.props.url}
        initialState={initialState}
        finishUp={this.props.finishUp}
        load={this.load.bind(this)}
        roles={this.state.roles || []}
        orgs={this.state.orgs || []}
        filters={this.props.filters}
      >
        <div className='field is-grouped'>
          <div className='control'>
            <button className='button is-primary'>Create</button>
          </div>
          <div className='control'>
            <button className='button' onClick={this.hideModal} type='button'>Cancel</button>
          </div>
        </div>
      </PasswordUserForm>
    )
  }

  getSendInviteForm () {
    return (
      <InviteUserForm
        baseUrl='/admin/users'
        url={this.props.url}
        initialState={initialState}
        finishUp={this.props.finishUp}
        load={this.props.load || this.load.bind(this)}
        roles={this.state.roles || []}
        orgs={this.state.orgs || []}
        filters={this.props.filters}
      >
        <div className='field is-grouped'>
          <div className='control'>
            <button className='button is-primary'>Invite</button>
          </div>
          <div className='control'>
            <button className='button' onClick={this.hideModal} type='button'>Cancel</button>
          </div>
        </div>
      </InviteUserForm>
    )
  }

  render () {
    var modalContent
    var title = 'Create user'
    if (env.EMAIL_SEND) {
      modalContent = this.getSendInviteForm()
      title = 'Invite user'
    } else {
      modalContent = this.getPasswordForm()
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
