import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'

import env from '~base/env-variables'
import api from '~base/api'
import PasswordUserForm from './password-form'
import InviteUserForm from './send-invite-form'

var initialState = {
  name: '',
  email: '',
  password_1: '',
  password_2: ''
}

class CreateUserNoModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      roles: [],
      groups: []
    }
  }

  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
    this.loadRoles()
    this.loadGroups()
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

  async loadGroups () {
    var url = '/app/groups/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      groups: body.data
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
        groups={this.state.groups || []}
      >
        <div className='field is-grouped is-padding-top-small'>
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
        roles={this.state.roles || []}
        filters={this.props.filters}
        groups={this.state.groups || []}
      >
        <div className='field is-grouped is-padding-top-small'>
          <div className='control'>
            <button className='button is-primary' type='submit'>Invitar</button>
          </div>
        </div>
      </InviteUserForm>
    )
  }

  render () {
    var content
    if (env.EMAIL_SEND) {
      content = this.getSendInviteForm()
    } else {
      content = this.getPasswordForm()
    }

    return (
      content
    )
  }
}

CreateUserNoModal.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreateUser = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreateUserNoModal)

export default BranchedCreateUser
