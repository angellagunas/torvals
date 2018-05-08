import React, { Component } from 'react'
import ImportCSV from './import-csv'
import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'

class ImportUsers extends Component {
  render () {
    return (
      <ImportCSV
        url='/app/users/import/'
        title='usuarios'
        format={
          <pre style={{ marginTop: '1em' }}>
            "name","screenName","email","password", "roleSlug", "projectExternalId"<br />
            "Juan Perez","Juan","juan@coporation.com","password", "manager-level-2"<br />
            "Roberto","roberto","roberto@copo.com","password", "manager-level-1", "c74ae49f-7a51-4b11-80f5-5baa2898f022"
          </pre>
        }
      />
    )
  }
}

export default Page({
  path: '/import/users',
  title: 'Usuarios',
  icon: 'user',
  exact: true,
  validate: [loggedIn, verifyRole],
  roles: 'orgadmin',
  component: ImportUsers
})
