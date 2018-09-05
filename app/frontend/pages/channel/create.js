import React, { Component } from 'react';
import BaseModal from '~base/components/base-modal';
import ChannelForm from './create-form';

var initialState = {
  name: '',
  externalId: '',
};

class CreateChannel extends Component {
  constructor(props) {
    super(props);
    this.hideModal = this.props.hideModal.bind(this);
    this.state = {
      isLoading: '',
    };
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
        title="Crear Canal"
        className={this.props.className}
        hideModal={this.hideModal}
      >
        <ChannelForm
          baseUrl="/app/channels"
          url={this.props.url}
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
        </ChannelForm>
      </BaseModal>
    );
  }
}

export default CreateChannel;
