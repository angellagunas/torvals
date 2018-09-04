import React, { Component } from 'react';

import api from '~base/api';
import { datasetStatus } from '~base/tools';

import {
  BaseForm,
  TextWidget,
  TextareaWidget,
  SelectWidget,
} from '~base/components/base-form';

const schema = {
  type: 'object',
  title: '',
  required: ['name', 'organization'],
  properties: {
    name: { type: 'string', title: 'Nombre' },
    description: { type: 'string', title: 'Descripción' },
  },
};

const uiSchema = {
  name: { 'ui:widget': TextWidget },
  description: { 'ui:widget': TextareaWidget, 'ui:rows': 3 },
};

class DatasetDetailForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
    };
    uiSchema['status'] = {
      'ui:widget': SelectWidget,
      'ui:disabled': !this.props.isAdmin,
    };
    schema.properties['status'] = {
      type: 'string',
      title: 'Estado',
      enum: Object.keys(datasetStatus),
      enumNames: Object.values(datasetStatus),
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      formData: nextProps.initialState,
    });
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
    if (this.props.submitHandler) this.props.submitHandler(formData);
    try {
      var data = await api.post(this.props.url, formData);
      await this.props.load();
      this.clearState();
      this.setState({ ...this.state, apiCallMessage: 'message is-success' });
      if (this.props.finishUp) this.props.finishUp(data.data);
      return;
    } catch (e) {
      if (this.props.errorHandler) this.props.errorHandler(e);
      return this.setState({
        ...this.state,
        error: e.message,
        apiCallErrorMessage: 'message is-danger',
      });
    }
  }

  render() {
    let { canEdit } = this.props;
    var error;
    if (this.state.error) {
      error = <div>Error: {this.state.error}</div>;
    }

    if (!canEdit) {
      uiSchema.name['ui:disabled'] = true;
      uiSchema.description['ui:disabled'] = true;
    }

    return (
      <div>
        <BaseForm
          schema={schema}
          uiSchema={uiSchema}
          formData={this.state.formData}
          onChange={e => {
            this.changeHandler(e);
          }}
          onSubmit={e => {
            this.submitHandler(e);
          }}
          onError={e => {
            this.errorHandler(e);
          }}
        >
          <div className={this.state.apiCallMessage}>
            <div className="message-body is-size-7 has-text-centered">
              Los datos se han guardado correctamente
            </div>
          </div>

          <div className={this.state.apiCallErrorMessage}>
            <div className="message-body is-size-7 has-text-centered">
              {error}
            </div>
          </div>
          {canEdit && this.props.children}
        </BaseForm>
      </div>
    );
  }
}

export default DatasetDetailForm;
