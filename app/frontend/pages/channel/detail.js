import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import api from '~base/api'
import { testRoles } from '~base/tools'

import Page from '~base/page'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ChannelForm from './create-form'
import DeleteButton from '~base/components/base-deleteButton'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'
import Multiselect from '~base/components/base-multiselect'
import FontAwesome from 'react-fontawesome'
import { toast } from 'react-toastify'

class ChannelDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      loaded: false,
      channel: {},
      roles: 'admin, orgadmin, analyst, manager-level-2, manager-level-3',
      canEdit: false,
      isLoading: '',
      groups: [],
      selectedGroups: [],
    };
  }

  componentWillMount() {
    this.load();
    this.setState({ canEdit: testRoles(this.state.roles) });
  }

  async load() {
    var url = '/app/channels/' + this.props.match.params.uuid;
    try {
      const body = await api.get(url);

      this.setState({
        loading: false,
        loaded: true,
        channel: body.data,
        selectedGroups: [...body.data.groups],
      });

      this.loadGroups();
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true,
      });
    }
  }

  async loadGroups() {
    var url = '/app/groups';
    const body = await api.get(url, {
      start: 0,
      limit: 0,
    });

    this.setState({
      ...this.state,
      groups: body.data,
    });
  }
  getSavingMessage() {
    let { saving, saved } = this.state;

    if (saving) {
      return (
        <p className='card-header-title' style={{fontWeight: '200', color: 'grey'}}>
          <FormattedMessage
            id="channel.savingMsg"
            defaultMessage={`Guardando`}
          /> <span style={{paddingLeft: '5px'}}><FontAwesome className='fa-spin' name='spinner' /></span>
        </p>
      );
    }

    if (saved) {
      if (this.savedTimeout) {
        clearTimeout(this.savedTimeout);
      }

      this.savedTimeout = setTimeout(() => {
        this.setState({
          saved: false,
        });
      }, 500);

      return (
        <p className='card-header-title' style={{fontWeight: '200', color: 'grey'}}>
          <FormattedMessage
            id="channel.saved"
            defaultMessage={`Guardado`}
          />
        </p>
      );
    }
  }

  async availableGroupOnClick(uuid) {
    this.setState({
      saving: true,
    });

    var selected = this.state.selectedGroups;
    var group = this.state.groups.find(item => {
      return item.uuid === uuid;
    });

    if (
      selected.findIndex(item => {
        return item.uuid === uuid;
      }) !== -1
    ) {
      return;
    }

    selected.push(group);

    this.setState({
      selectedGroups: selected,
    });

    var url = '/app/channels/' + this.props.match.params.uuid + '/add/group';

    try {
      await api.post(url, {
        group: uuid,
      });
    } catch (e) {
      var index = this.state.selectedGroups.findIndex(item => {
        return item.uuid === uuid;
      });
      var selectedRemove = this.state.selectedGroups;
      selectedRemove.splice(index, 1);
      this.notify(e.message, 5000, toast.TYPE.ERROR);
    }

    setTimeout(() => {
      this.setState({
        saving: false,
        saved: true,
      });
    }, 300);
  }

  async assignedGroupOnClick(uuid) {
    this.setState({
      saving: true,
    });

    var index = this.state.selectedGroups.findIndex(item => {
      return item.uuid === uuid;
    });
    var selected = this.state.selectedGroups;

    if (index === -1) {
      return;
    }

    selected.splice(index, 1);

    this.setState({
      selectedGroups: selected,
    });

    var url = '/app/channels/' + this.props.match.params.uuid + '/remove/group';
    await api.post(url, {
      group: uuid,
    });

    setTimeout(() => {
      this.setState({
        saving: false,
        saved: true,
      });
    }, 300);
  }

  async deleteObject() {
    var url = '/app/channels/' + this.props.match.params.uuid;
    await api.del(url);
    this.props.history.push('/catalogs/channels');
  }

  submitHandler() {
    this.setState({ isLoading: ' is-loading' });
  }

  errorHandler() {
    this.setState({ isLoading: '' });
  }

  finishUpHandler() {
    this.setState({ isLoading: '' });
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false,
      });
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false,
      });
    }
  }

  render() {
    if (this.state.notFound) {
      return <NotFound msg="este canal" />;
    }

    let { loaded, canEdit } = this.state;
    if (!loaded) {
      return <Loader />;
    }

    let channel = {
      name: this.state.channel.name,
      organization: this.state.channel.organization.uuid,
      externalId: this.state.channel.externalId,
    };

    const availableList = this.state.groups.filter(item => {
      return (
        this.state.selectedGroups.findIndex(group => {
          return group.uuid === item.uuid;
        }) === -1
      );
    });

    let groupField;
    if (testRoles('analyst') || testRoles('orgadmin')) {
      groupField = <div className='column'>
        <div className='columns'>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  <FormattedMessage
                    id="channel.groups"
                    defaultMessage={`Grupos`}
                  />
                </p>
                <div>
                  {this.getSavingMessage()}
                </div>
              </header>
              <div className='card-content'>
                <Multiselect //TODO: translate
                  availableTitle='Disponible'
                  assignedTitle='Asignado'
                  assignedList={this.state.selectedGroups}
                  availableList={availableList}
                  dataFormatter={(item) => { return item.name || 'N/A' }}
                  availableClickHandler={this.availableGroupOnClick.bind(this)}
                  assignedClickHandler={this.assignedGroupOnClick.bind(this)}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="detail-page">
        <div className="section-header">
          <h2>{channel.name}</h2>
        </div>

        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <Breadcrumb
                path={[
                  { //TODO: translate
                    path: '/',
                    label: 'Inicio',
                    current: false,
                  },
                  { //TODO: translate
                    path: '/catalogs/channels',
                    label: 'Canales',
                    current: false,
                  },
                  { //TODO: translate
                    path: '/catalogs/channels/',
                    label: channel.name,
                    current: true,
                  },
                ]}
                align="left"
              />
            </div>
          </div>
          <div className='level-right'>
            <div className='level-item'>
              {canEdit &&
                <DeleteButton
                  //TODO: translate
                  titleButton={'Eliminar'}
                  objectName='Canal'
                  objectDelete={this.deleteObject.bind(this)}
                  message={`¿Estas seguro de quieres borrar el canal ${
                    channel.name
                  }?`}
                />
              )}
            </div>
          </div>
        </div>

        <div className='section is-paddingless-top pad-sides'>

          <div className='columns'>
            <div className='column'>
              <div className='card'>
                <header className='card-header'>
                  <p className='card-header-title'>
                    <FormattedMessage
                      id="channel.detail"
                      defaultMessage={`Detalle`}
                    />
                  </p>
                </header>
                <div className="card-content">
                  <div className="columns">
                    <div className="column">
                      <ChannelForm
                        baseUrl="/app/channels"
                        url={'/app/channels/' + this.props.match.params.uuid}
                        initialState={channel}
                        load={this.load.bind(this)}
                        canEdit={canEdit}
                        submitHandler={(data) => this.submitHandler(data)}
                        errorHandler={(data) => this.errorHandler(data)}
                        finishUp={(data) => this.finishUpHandler(data)}
                      >
                        <div className='field is-grouped'>
                          <div className='control'>
                            <button
                              className={
                                'button is-primary ' + this.state.isLoading
                              }
                              disabled={!!this.state.isLoading}
                              type='submit'
                            >
                              <FormattedMessage
                                id="channel.btnSave"
                                defaultMessage={`Guardar`}
                              />
                            </button>
                          </div>
                        </div>
                      </ChannelForm>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {groupField}
          </div>
        </div>
      </div>
    );
  }
}

export default Page({
  path: '/catalogs/channels/:uuid',
  title: 'Channel Detail', //TODO: translate
  exact: true,
  roles:
    'analyst, orgadmin, admin, consultor-level-2, manager-level-2, consultor-level-3, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: ChannelDetail,
});
