import React, { Component } from 'react'
import ImportCSV from '../import/import-csv'
import BaseModal from '~base/components/base-modal'

class ImportCatalog extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
    this.state = {
      isLoading: ''
    }
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  render () {
    return (
      <div>
        <BaseModal
          title={'Importar ' + this.props.title}
          className={this.props.className + ' import-modal'}
          hideModal={this.hideModal}>
          <ImportCSV
            isModal
            type={this.props.branchName}
            url='/app/catalogItems/import'
            title={this.props.title}
            finishUp={this.props.finishUp}
            format={
              <pre style={{ marginTop: '1em' }}>
              "name","externalId"<br />
              "nombre de {this.props.title}","12888"
          </pre>
          }
        />
        </BaseModal>
      </div>
    )
  }
}

export default ImportCatalog
