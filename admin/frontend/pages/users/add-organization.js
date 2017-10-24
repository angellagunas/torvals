import React, { Component } from 'react'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'

import BaseModal from '~base/components/base-modal'
import OrganizationRoleForm from './org-role-form'

var initialState = {}

class AddOrganization extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
    this.state = {
      roles: [],
      orgs: []
    }
  }

  componentWillMount () {
    this.loadRoles()
    this.loadOrgs()
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

  render () {
    return (
      <BaseModal
        title='Add Organization'
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <OrganizationRoleForm
          baseUrl='/admin/users'
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={initialState}
          roles={this.state.roles || []}
          orgs={this.state.orgs || []}
          load={this.props.load}
        >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary'>Add</button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal}>Cancel</button>
            </div>
          </div>
        </OrganizationRoleForm>
      </BaseModal>
    )
  }
}

AddOrganization.contextTypes = {
  tree: PropTypes.baobab
}

export default AddOrganization
