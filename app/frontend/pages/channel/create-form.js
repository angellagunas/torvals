import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import api from '~base/api'

import { BaseForm, TextWidget } from '~base/components/base-form';

const uiSchema = {
  name: { 'ui:widget': TextWidget },
  externalId: { 'ui:widget': TextWidget },
};

class ChannelForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
    };
  }

  errorHandler(e) {}

  changeHandler({ formData }) {
    this.setState({
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
    });
  }

  clearState() {
    this.setState({
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: this.props.initialState,
    });
  }

  async submitHandler({ formData }) {
    formData.isDefault = undefined;
    if (this.props.submitHandler) this.props.submitHandler(formData);
    try {
      var data = await api.post(this.props.url, formData);
      if (this.props.load) {
        await this.props.load();
      }
      this.clearState();
      this.setState({ ...this.state, apiCallMessage: 'message is-success' });
      if (this.props.finishUp) this.props.finishUp(data.data);
    } catch (e) {
      if (this.props.errorHandler) this.props.errorHandler(e);
      return this.setState({
        ...this.state,
        error: e.message,
        apiCallErrorMessage: 'message is-danger',
      });
    }
  }

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  render () {

    const schema = {
      type: 'object',
      title: '',
      required: [
        'name',
        'externalId'
      ],
      properties: {
        name: { type: 'string', title: this.formatTitle('tables.colName') },
        externalId: { type: 'string', title: this.formatTitle('datasets.externalId') }
      }
    }

    let { canEdit, canCreate, children } = this.props
    var error

    if (this.state.error) {
      error = <div>Error: {this.state.error}</div>;
    }

    if (!canEdit || !canCreate) {
      for (let key in uiSchema) {
        uiSchema[key]['ui:disabled'] = true;
      }
    }

    if (canEdit || canCreate) {
      for (let key in uiSchema) {
        uiSchema[key]['ui:disabled'] = false;
      }
    }

    return (<div>
      <BaseForm schema={schema}
        uiSchema={uiSchema}
        formData={this.state.formData}
        onChange={(e) => { this.changeHandler(e) }}
        onSubmit={(e) => { this.submitHandler(e) }}
        onError={(e) => { this.errorHandler(e) }}>
        <div className={this.state.apiCallMessage}>
          <div className='message-body is-size-7 has-text-centered'>
            <FormattedMessage
              id="channel.savedMsg"
              defaultMessage={`Los datos se han guardado correctamente`}
            />
          </div>
          <div className={this.state.apiCallErrorMessage}>
            <div className="message-body is-size-7 has-text-centered">
              {error}
            </div>
          </div>
          {canEdit && children}
          {canCreate && children}
        </div>
      </BaseForm>
    </div>
    );
  }
}

export default injectIntl(ChannelForm)
