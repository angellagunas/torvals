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

  render () {
    let data = this.props.listData
    let defaultObject = this.props.defaultObject

    return (
      <div>
        <div className='navbar-item has-dropdown is-hoverable'>
          <div className='navbar-link'>
            {defaultObject.name}
          </div>
          <div id='moreDropdown' className='navbar-dropdown is-boxed'>
            {data.map((d, index) => {
              if (index < data.length - 1) {
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
        </div>
      </div>
    )
  }
}

export default DropdownSelect
