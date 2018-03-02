import React, { Component } from 'react'
import tree from '~core/tree'
import cookies from '~base/cookies'
import env from '~base/env-variables'

var user
var organization

class SelectOrg extends Component {
  constructor (props) {
    super(props)
    this.state = {
      toggled: true
    }
    user = tree.get('user')

    organization = tree.get('organization')
  }

  handleToggle () {
    this.setState({
      toggled: !this.state.toggled
    })
  }

  hideDrop () {
    this.setState({
      toggled: true
    })
  }

  showDrop () {
    this.setState({
      toggled: false
    })
  }

  getDefaultObject () {
    if (organization) {
      return (
        <div>
          <a aria-current='false' href='javascript:void(0)' onClick={this.handleToggle.bind(this)}>
            <div className='media'>
              <figure className='media-left image is-24x24'>
                <img src={organization.profileUrl} alt='Avatar' />
              </figure>
              <div className='media-content'>
                <span className='item-link-title'>{organization.name}</span>
                {
                  user.organizations.length > 1
                  ? <span className='icon is-pulled-right has-text-primary'>
                    <span aria-hidden='true' className={this.state.toggled ? 'fa fa-angle-right' : 'fa fa-angle-down'} />
                  </span>
                  : null
                }
              </div>
            </div>
          </a>
          <ul className={this.state.toggled ? 'is-hidden' : ''} >
            {this.getOrgs()}
          </ul>
        </div>

      )
    }

    return 'Select an organization'
  }

  async changeHandler (slug) {
    tree.set('shouldSelectOrg', false)
    await tree.commit()
    cookies.set('organization', slug)
    const hostname = window.location.hostname
    const hostnameSplit = hostname.split('.')

    if (env.ENV === 'production') {
      if (hostname.indexOf('stage') >= 0) {
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

  getOrgs () {
    let list = user.organizations.map(item => {
      if (organization.slug !== item.organization.slug) {
        return (
          <li
            key={item.organization.slug}
            onClick={e => { this.changeHandler(item.organization.slug) }}>
            <a
              aria-current='false'
              href='javascript:void(0)'>
              <div className='media'>
                <figure className='media-left image is-24x24'>
                  <img src={item.organization.profileUrl} alt='Avatar' />
                </figure>
                <div className='media-content'>
                  <span className='item-link-title'>{item.organization.name}</span>
                </div>
              </div>
            </a>
          </li>
        )
      }
    })

    return list
  }

  getDropdown () {
    if (organization) {
      return (
        <div className='dropdown'
          onMouseLeave={this.hideDrop.bind(this)}
          onMouseOver={this.showDrop.bind(this)}>
          <a className='is-paddingless'
            aria-current='false'
            href='javascript:void(0)'>
            <figure className='image is-24x24'>
              <img src={organization.profileUrl} alt='Avatar' />
            </figure>
          </a>
          <ul className={this.state.toggled ? 'is-hidden' : ''} >
            {this.getOrgs()}
          </ul>
        </div>

      )
    }

    return 'Select an organization'
  }

  render () {
    return (

      <li>
        {this.props.collapsed ? this.getDropdown() : this.getDefaultObject()}
      </li>

    )
  }
}

export default SelectOrg
