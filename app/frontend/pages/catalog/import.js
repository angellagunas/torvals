import React, { Component } from 'react'
import ImportCSV from '../import/import-csv'
import BaseModal from '~base/components/base-modal'
import { injectIntl } from 'react-intl'

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

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  render () {
    return (
      <div>
        <BaseModal
          title={this.formatTitle('catalogs.import') + ' ' + this.props.title}
          className={this.props.className + ' import-modal'}
          hideModal={this.hideModal}
        >
          <ImportCSV
            isModal
            type={this.props.branchName}
            url='/app/catalogItems/import'
            title={this.props.title}
            finishUp={this.props.finishUp}
            format={
              <pre style={{ marginTop: '1em' }}>
                "name","externalId"<br />
                "{this.props.title}","12888"
              </pre>
            }
          />
        </BaseModal>
      </div>
    )
  }
}

export default injectIntl(ImportCatalog)
