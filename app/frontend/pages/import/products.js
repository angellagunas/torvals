import React, { Component } from 'react';
import Page from '~base/page';
import { loggedIn, verifyRole } from '~base/middlewares/';
import ImportCSV from './import-csv';

class ImportProducts extends Component {
  render() {
    return (
      <ImportCSV
        url="/app/products/import/"
        title="productos"
        format={
          <pre style={{ marginTop: '1em' }}>
            "name","description","category","subcategory","externalId"
            <br />
            "Chips 50G","Chips fuego contenido
            50G","categoría","subcategoría","123123"
          </pre>
        }
      />
    );
  }
}

export default Page({
  path: '/import/products',
  title: 'Productos',
  icon: 'dropbox',
  exact: true,
  validate: [loggedIn, verifyRole],
  roles: 'orgadmin, manager-level-3',
  component: ImportProducts,
});
