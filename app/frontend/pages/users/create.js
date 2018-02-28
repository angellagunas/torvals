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
      roles: []
    }
  }

  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
    this.loadRoles()
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
      ...this.state,
      roles: body.data
    })
  }

  getPasswordForm () {
    return (
      <PasswordUserForm
        baseUrl='/app/users'
        url={this.props.url}
        initialState={initialState}
        finishUp={this.props.finishUp}
        load={this.load.bind(this)}
        roles={this.state.roles || []}
      >
        <div className='field is-grouped'>
          <div className='control'>
            <button className='button is-primary' type='submit'>Crear</button>
          </div>
          <div className='control'>
            <button className='button' onClick={this.hideModal} type='button'>Cancelar</button>
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
        initialState={initialState}
        finishUp={this.props.finishUp}
        load={this.load.bind(this)}
        roles={this.state.roles}
        filters={this.props.filters}
      >
        <div className='field is-grouped'>
          <div className='control'>
            <button className='button is-primary' type='submit'>Invitar</button>
          </div>
          <div className='control'>
            <button className='button' onClick={this.hideModal} type='button'>Cancelar</button>
          </div>
        </div>
      </InviteUserForm>
    )
  }

  render () {
    var modalContent
    var title = 'Crear usuario'

    if (this.state.roles.length > 0) {
      initialState.role = this.state.roles.find(item => {
        return item.isDefault === true
      })._id
    }

    if (env.EMAIL_SEND) {
      modalContent = this.getSendInviteForm()
      title = 'Invitar usuario'
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
