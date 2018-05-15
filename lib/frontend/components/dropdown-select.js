import React, { Component } from 'react'

import tree from '~core/tree'
import env from '~base/env-variables'
import cookies from '~base/cookies'

class DropdownSelect extends Component {
  constructor (props) {
    super(props)
    this.state = {
      data: [],
      defaultObject: {}
    }
  }

  errorHandler (e) {}

  async changeHandler (id) {
    tree.set('shouldSelectOrg', false)
    await tree.commit()

    cookies.set('organization', id)

    const hostname = window.location.hostname
    const hostnameSplit = hostname.split('.')
    if (env.ENV === 'production') {
      if (hostname.indexOf('stage') >= 0 || hostname.indexOf('staging') >= 0) {
        const newHostname = hostnameSplit.slice(-3).join('.')
        window.location = `//${id}.${newHostname}/dashboard`
      } else {
        const newHostname = hostnameSplit.slice(-2).join('.')
        window.location = `//${id}.${newHostname}/dashboard`
      }
    } else {
      const baseUrl = env.APP_HOST.split('://')
      window.location = baseUrl[0] + '://' + id + '.' + baseUrl[1] + '/dashboard'
    }
  }

  getDropdown () {
    let data = this.props.listData
    let defaultObject = this.props.defaultObject

    if (data.length > 1) {
      return (
        <div id='moreDropdown' className='navbar-dropdown is-boxed'>
          {data.map((d, index) => {
            if (d.id === defaultObject.id) return null

            if (index < data.length - 1 && data.length > 2) {
              return (
                <div key={d.key}>
                  <a
                    className='navbar-item '
                    href='#'
                    onClick={e => { this.changeHandler(d.id) }}
                    >
                    {d.data}
                  </a>
                  <hr className='navbar-divider' />
                </div>
              )
            } else {
              return (
                <div key={d.key}>
                  <a
                    className='navbar-item '
                    href='#'
                    onClick={e => { this.changeHandler(d.id) }}
                    >
                    {d.data}
                  </a>
                </div>
              )
            }
          })}
        </div>
      )
    }
  }

  getTitle () {
    let data = this.props.listData
    let defaultObject = this.props.defaultObject

    if (data.length > 1) {
      return (
        <div className='navbar-link'>
          {defaultObject.data}
        </div>
      )
    }

    return (
      defaultObject.id
    )
  }

  getComponent () {
    let data = this.props.listData
    let defaultObject = this.props.defaultObject

    if (data.length > 1) {
      return (
        <div className='navbar-item has-dropdown is-hoverable'>
          {this.getTitle()}
          {this.getDropdown()}
        </div>
      )
    }

    return (
      <a className='navbar-item ' href='#'>
        {defaultObject.data}
      </a>
    )
  }

  render () {
    return (
      <div className='dropdown-select'>
        {this.getComponent()}
      </div>
    )
  }
}

export default DropdownSelect
