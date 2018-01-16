import React, { Component } from 'react'

import tree from '~core/tree'
import cookies from '~base/cookies'
import env from '~base/env-variables'

class SelectOrganizationForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        organization: ''
      },
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }
  }

  async changeHandler (slug) {
    tree.set('shouldSelectOrg', false)
    await tree.commit()
    cookies.set('organization', slug)
    var data = env.APP_HOST.split('://')
    window.location = data[0] + '://' + slug + '.' + data[1] + '/dashboard'
  }

  getDefaultObject () {
    let organization = tree.get('organization')

    if (organization) {
      return (<a className='navbar-link'>
        <img className='is-rounded avatar-org-dropdown' src={organization.profileUrl} width='45' height='45' alt='Avatar' />
        <strong>{organization.name}</strong>
      </a>)
    }

    return 'Select an organization'
  }

  render () {
    let user = tree.get('user')

    let organization = tree.get('organization')

    let listData = user.organizations.map(item => {
      if (organization.slug !== item.organization.slug) {
        return (<a className='navbar-item' key={item.organization.slug} onClick={e => { this.changeHandler(item.organization.slug) }}>
          <img className='is-rounded avatar-org-dropdown' src={item.organization.profileUrl} width='45' height='45' alt='Avatar' />
          <strong>{item.organization.name}</strong>
        </a>)
      }
    })
    return (
      <nav className='navbar bg-whitesmoke' role='navigation' aria-label='dropdown navigation'>
        <div className='navbar-item has-dropdown is-hoverable'>
          {this.getDefaultObject()}
          <div className='navbar-dropdown'>
            {listData}
          </div>
        </div>
      </nav>
    )
  }
}

export default SelectOrganizationForm
