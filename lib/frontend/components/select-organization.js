import React, { Component } from 'react'

import tree from '~core/tree'
import cookies from '~base/cookies'
import env from '~base/env-variables'

var user
var organization

class SelectOrganizationForm extends Component {
  constructor (props) {
    super(props)
    user = tree.get('user')

    organization = tree.get('organization')
  }

  async changeHandler (slug) {
    tree.set('shouldSelectOrg', false)
    await tree.commit()
    cookies.set('organization', slug)

    const hostname = window.location.hostname
    const hostnameSplit = hostname.split('.')
    if (env.ENV === 'production') {
      if (hostname.indexOf('stage') >= 0 || hostname.indexOf('staging') >= 0) {
        const newHostname = hostnameSplit.slice(-3).join('.')
        window.location = `//${slug}.${newHostname}/dashboard`
      } else {
        const newHostname = hostnameSplit.slice(-2).join('.')
        window.location = `//${slug}.${newHostname}/dashboard`
      }
    } else {
      const baseUrl = env.APP_HOST.split('://')
      window.location = baseUrl[0] + '://' + slug + '.' + baseUrl[1] + '/dashboard'
    }
  }

  getDefaultObject () {
    if (organization) {
      return (
        <a className={user.organizations.length > 1 ? 'navbar-link' : 'navbar-item'}>
          <img className='is-rounded avatar-org-dropdown'
            src={organization.profileUrl}
            width='45'
            height='45'
            alt='Avatar' />
          <strong>{organization.name}</strong>
        </a>
      )
    }

    return 'Select an organization'
  }

  render () {
    let listData = user.organizations.map(item => {
      if (organization.slug !== item.organization.slug) {
        return (
          <a className='navbar-item'
            key={item.organization.slug}
            onClick={e => { this.changeHandler(item.organization.slug) }}>
            <img className='is-rounded avatar-org-dropdown'
              src={item.organization.profileUrl}
              width='45'
              height='45'
              alt='Avatar' />
            <strong>{item.organization.name}</strong>
          </a>
        )
      }
    })
    return (
      <nav className={this.props.className ? '' + this.props.className : 'bg-whitesmoke'}
        role='navigation'
        aria-label='dropdown navigation'>
        <div className='navbar-item has-dropdown is-hoverable'>
          {this.getDefaultObject()}
          {user.organizations.length > 1
            ? <div className='navbar-dropdown is-boxed'>
              {listData}
            </div>
            : null}
        </div>
      </nav>
    )
  }
}

export default SelectOrganizationForm
