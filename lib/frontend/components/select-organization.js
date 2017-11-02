import React, { Component } from 'react'

import tree from '~core/tree'
import DropdownSelect from './dropdown-select'

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

  getDefaultObject () {
    let organization = tree.get('organization')

    if (organization) {
      return ({
        id: organization.slug,
        data: (
          <div className='columns is-1 is-variable'>
            <div className='column is-one-third'>
              <img className='is-rounded' src={organization.profileUrl} width='45' height='45' alt='Avatar' />
            </div>
            <div className='column'>
              <p className='navbar-select-name'>
                <strong>{organization.name}</strong>
              </p>
            </div>
          </div>
        )
      })
    }

    return 'Select an organization'
  }

  render () {
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
      <DropdownSelect
        listData={listData}
        defaultObject={this.getDefaultObject()}
      />
    )
  }
}

export default SelectOrganizationForm
