import React, { Component } from 'react'

import Loader from '~base/components/spinner'

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
              <SelectOrganizationForm />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SelectOrg
