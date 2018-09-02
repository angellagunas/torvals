import React, { Component } from 'react';
import ImportCSV from '../import/import-csv';
import BaseModal from '~base/components/base-modal';
import tree from '~core/tree';

class ImportPrices extends Component {
  constructor(props) {
    super(props);
    this.hideModal = this.props.hideModal.bind(this);
    this.state = {
      isLoading: '',
    };
    this.rules = tree.get('rule');
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  getExample() {
    let str = '"productExternalId",';
    for (let a of this.rules.catalogs) {
      if (a.slug === 'producto') continue;
      str += `"${a.slug}-externalId",`;
    }
    str += `"price"`;

    str += '\n\r"1234",';
    for (let a of this.rules.catalogs) {
      if (a.slug === 'producto') continue;
      str += `"${this.getRandomInt(1000, 9999)}",`;
    }
    str += `"${this.getRandomInt(10, 200)}"`;

    str += '\n\r"1235",';
    for (let a of this.rules.catalogs) {
      if (a.slug === 'producto') continue;
      str += `"${this.getRandomInt(1000, 9999)}",`;
    }
    str += `"${this.getRandomInt(10, 200)}"`;

    return str;
  }

  submitHandler() {
    this.setState({ isLoading: ' is-loading' });
  }

  errorHandler() {
    this.setState({ isLoading: '' });
  }

  render() {
    let example = this.getExample();

    return (
      <div>
        <BaseModal
          title={'Importar ' + this.props.title}
          className={this.props.className + ' import-modal'}
          hideModal={this.hideModal}
        >
          <ImportCSV
            isModal
            type={this.props.branchName}
            title={this.props.title}
            finishUp={this.props.finishUp}
            url="/app/prices/import/"
            format={<pre style={{ marginTop: '1em' }}>{example}</pre>}
          />
        </BaseModal>
      </div>
    );
  }
}

export default ImportPrices;
