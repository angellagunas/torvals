import React, { Component } from 'react'
import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import ImportCSV from './import-csv'

class ImportChannels extends Component {
  render () {
    return (
      <ImportCSV
        url='/app/channels/import/'
        title='canales'
        format={
          <pre style={{ marginTop: '1em' }}>
            "name","externalId"<br />
            "detalle","12888"
          </pre>
        }
      />
    )
  }
}

export default Page({
  path: '/import/channels',
  title: 'Canales',
  icon: 'filter',
  exact: true,
  validate: [loggedIn, verifyRole],
  roles: 'orgadmin, manager-level-3',
  component: ImportChannels
})
