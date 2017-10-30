import React, { Component } from 'react'

import Loader from '~base/components/spinner'
import tree from '~core/tree'
import env from '~base/env-variables'
import cookies from '~base/cookies'

import SelectOrganizationForm from '~base/components/select-organization'

class SelectOrg extends Component {
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

  async changeHandler (id) {
    tree.set('shouldSelectOrg', false)
    await tree.commit()

    cookies.set('organization', id)
    var data = env.APP_HOST.split('://')
    window.location = data[0] + '://' + id + '.' + data[1]
  }

  getDropdown () {
    let user = tree.get('user')
    let listData = user.organizations.map(item => {
      return {
        id: item.organization.slug,
        key: item.organization.uuid,
        data: (
          <div className='columns'>
            <div className='column is-one-third'>
              <img className='is-rounded' src={item.organization.profileUrl} width='45' height='45' alt='Avatar' />
            </div>
            <div className='column'>
              <p>
                <strong>{item.organization.name}</strong>
                <br />
                <small>{item.organization.description}</small>
              </p>
            </div>
          </div>
        )
      }
    })

    return (
      <div className='navbar-item-height'>
        {listData.map((d, index) => {
          if (index < listData.length - 1) {
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

  render () {
    let spinner

    if (this.state.loading) {
      return <Loader />
    }

    return (
      <div className={'LogIn single-form ' + this.props.className}>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Select Organization to log in
            </p>
            <a className='card-header-icon'>
              <span className='icon'>
                <i className='fa fa-angle-down' />
              </span>
            </a>
          </header>
          <div className='card-content'>
            <div className='content'>
              { spinner }
              {this.getDropdown()}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SelectOrg
