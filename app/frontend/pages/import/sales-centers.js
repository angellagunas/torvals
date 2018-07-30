import React, { Component } from 'react'
import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import ImportCSV from './import-csv'

class ImportSalesCenter extends Component {
  render () {
    return (
      <ImportCSV
        url='/app/salesCenters/import/'
        title='centros de venta'
        format={
          <pre style={{ marginTop: '1em' }}>
          "name","description","externalId"<br />
          "Centro","Ventas","12888"
        </pre>
      }
    />

    )
  }
}

export default Page({
  path: '/import/salesCenters',
  title: 'Centros de venta ', //TODO: translate
  icon: 'credit-card-alt',
  exact: true,
  validate: [loggedIn, verifyRole],
  roles: 'orgadmin, manager-level-3',
  component: ImportSalesCenter
})
