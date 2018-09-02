import React, { Component } from 'react';
import BaseModal from '~base/components/base-modal';
import CreateForm from './create-form';

var initialState = {
  name: '',
  externalId: '',
  type: '',
};

class CreateCatalog extends Component {
  constructor(props) {
    super(props);
    this.hideModal = this.props.hideModal.bind(this);
    this.state = {
      isLoading: '',
    };
    initialState.type = this.props.branchName;
  }

  submitHandler() {
    this.setState({ isLoading: ' is-loading' });
  }

  errorHandler() {
    this.setState({ isLoading: '' });
  }

  render() {
    return (
      <BaseModal
        title={'Crear ' + this.props.title}
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <CreateForm
          baseUrl="/app/catalogItems/create"
          url={'/app/catalogItems/create'}
          finishUp={this.props.finishUp}
          initialState={initialState}
          submitHandler={data => this.submitHandler(data)}
          errorHandler={data => this.errorHandler(data)}
          canCreate={this.props.canCreate}
        >
          <div className="field is-grouped">
            <div className="control">
              <button
                className={'button is-primary ' + this.state.isLoading}
                disabled={!!this.state.isLoading}
                type="submit"
              >
                Crear
              </button>
            </div>
            <div className="control">
              <button className="button" type="button" onClick={this.hideModal}>
                Cancelar
              </button>
            </div>
          </div>
        </CreateForm>
      </BaseModal>
    );
  }
}

export default CreateCatalog;
