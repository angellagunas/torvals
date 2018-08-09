import React, { Component } from 'react'
import ImportCSV from './import-csv'
import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import { CheckboxWidget } from '~base/components/base-form'

class ImportUsers extends Component {
  render () {
    let extraFields = {
      schema: {
        properties: {
          sendEmail: {type: 'boolean', title: 'No utilizar contraseña y enviar invitación a Orax'}
        }
      },
      uiSchema: {
        sendEmail: {'ui:widget': CheckboxWidget}
      },
      formData: {
        sendEmail: false
      }
    }

    return (
      <ImportCSV
        url='/app/users/import/'
        title='usuarios'
        extraFields={extraFields}
        format={
          <pre style={{ marginTop: '1em' }}>
            "name","email","password", "role", "projectExternalId"<br />
            "Juan Perez","Juan","juan@coporation.com","password", "Manager level 2"<br />
            "Roberto","roberto","roberto@copo.com","password", "Manager level 1", "c74ae49f-7a51-4b11-80f5-5baa2898f022"
          </pre>
        }
      />
    )
  }
}

export default Page({
  path: '/import/users',
  title: 'Usuarios',
  icon: 'user-plus',
  exact: true,
  validate: [loggedIn, verifyRole],
  roles: 'orgadmin, manager-level-3',
  component: ImportUsers
})
