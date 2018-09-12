import React, { Component } from 'react'
import ImportCSV from './import-csv'
import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import { CheckboxWidget } from '~base/components/base-form'
import { injectIntl } from 'react-intl'

class ImportUsers extends Component {
  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }
  render () {
    let extraFields = {
      schema: {
        properties: {
          sendEmail: {type: 'boolean', title: this.formatTitle('import.usersMsg')}
        }
      },
      uiSchema: {
        sendEmail: {
          'ui:widget': CheckboxWidget,
          'ui:className': 'has-text-centered'
        }
      },
      formData: {
        sendEmail: true
      }
    }

    return (
      <ImportCSV
        url='/app/users/import/'
        title={this.formatTitle('import.users')}
        extraFields={extraFields}
        format={
          <pre style={{ marginTop: '1em' }}>
            "name","email","password", "role", "projectId"<br />
            "Juan Perez","juan@coporation.com","P4ssW0rd","Manager level 2",""<br />
            "Roberto","roberto@copo.com","","Manager level 1","c74ae49f-7a51-4b11-80f5-5baa2898f022"
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
  component: injectIntl(ImportUsers)
})
