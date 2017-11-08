import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'

import BaseModal from '~base/components/base-modal'
import ConfigureDatasetForm from './configure-form'
import Loader from '~base/components/spinner'

class ConfigureDataSet extends Component {
  constructor (props) {
    super(props)
    this.state = {
      organizations: []
    }
  }

  componentWillMount () {
    this.loadOrgs()
  }

  async loadOrgs () {
    var url = '/admin/organizations/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,

      organizations: body.data

    })

    // console.log(this.state.isDate.map(item => { return item.name }))
  }

  render () {
    return (

      <ConfigureDatasetForm
        formData={{
          isDate: {
            enumNames: this.state.organizations.map(item => { return item.name }),
            enum: this.state.organizations.map(item => { return item.uuid })
          },
          analyze: {
            enumNames: this.state.organizations.map(item => { return item.name }),
            enum: this.state.organizations.map(item => { return item.uuid })
          }
        }}
        organizations={this.state.organizations}
      />

    )
  }
}

export default ConfigureDataSet
