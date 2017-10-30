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
    var data = env.APP_HOST.split('://')
    window.location = data[0] + '://' + id + '.' + data[1]
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
