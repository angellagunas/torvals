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

  render () {
    let user = tree.get('user')
    let organization = tree.get('organization')

    let listData = user.organizations.map(item => {
      return {
        id: item.organization.slug,
        key: item.organization.uuid,
        data: (
          <p>
            <strong>{item.organization.name}</strong>
            <br />
            <small>{item.organization.description}</small>
          </p>
        )
      }
    })

    return (
      <DropdownSelect
        listData={listData}
        defaultObject={organization}
      />
    )
  }
}

export default SelectOrganizationForm
