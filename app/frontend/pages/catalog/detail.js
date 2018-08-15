import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import api from '~base/api'
import { testRoles } from '~base/tools'

import Page from '~base/page'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ChannelForm from '../channel/create-form'
import DeleteButton from '~base/components/base-deleteButton'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'
import FontAwesome from 'react-fontawesome'
import { toast } from 'react-toastify'
import Multiselect from '~base/components/base-multiselect'

const cleanName = (item) => {
  let c = item.replace(/-/g, ' ')
  return c.charAt(0).toUpperCase() + c.slice(1)
}

class CatalogDetail extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      catalog: {},
      roles: 'admin, orgadmin, analyst, manager-level-2, manager-level-3',
      canEdit: false,
      isLoading: '',
      selectedGroups: [],
      groups: []
    }
  }

  componentWillMount() {
    this.load()
    this.setState({ canEdit: testRoles(this.state.roles) })
  }

  async load() {
    var url = '/app/catalogItems/detail/' + this.props.match.params.uuid
    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        catalog: body.data,
        selectedGroups: [...body.data.groups]
      })

      await this.loadGroups()
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async loadGroups() {
    var url = '/app/groups'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      groups: body.data
    })
  }

  getSavingMessage() {
    let { saving, saved } = this.state

    if (saving) {
      return (
        <p className='card-header-title' style={{ fontWeight: '200', color: 'grey' }}>
          <FormattedMessage
            id="catalog.saving"
            defaultMessage={`Guardando`}
          /> <span style={{ paddingLeft: '5px' }}><FontAwesome className='fa-spin' name='spinner' /></span>
        </p>
      )
    }

    if (saved) {
      if (this.savedTimeout) {
        clearTimeout(this.savedTimeout)
      }

      this.savedTimeout = setTimeout(() => {
        this.setState({
          saved: false
        })
      }, 500)

      return (
        <p className='card-header-title' style={{ fontWeight: '200', color: 'grey' }}>
          <FormattedMessage
            id="catalog.saved"
            defaultMessage={`Guardado`}
          />
        </p>
      )
    }
  }

  async availableGroupOnClick(uuid) {
    this.setState({
      saving: true
    })

    var selected = this.state.selectedGroups
    var group = this.state.groups.find(item => { return item.uuid === uuid })

    if (selected.findIndex(item => { return item.uuid === uuid }) !== -1) {
      return
    }

    selected.push(group)

    this.setState({
      selectedGroups: selected
    })

    var url = '/app/catalogItems/' + this.props.match.params.uuid + '/add/group'

    try {
      await api.post(url,
        {
          group: uuid
        }
      )
    } catch (e) {
      var index = this.state.selectedGroups.findIndex(item => { return item.uuid === uuid })
      var selectedRemove = this.state.selectedGroups
      selectedRemove.splice(index, 1)
      this.notify(
        e.message,
        5000,
        toast.TYPE.ERROR
      )
    }

    setTimeout(() => {
      this.setState({
        saving: false,
        saved: true
      })
    }, 300)
  }

  async assignedGroupOnClick(uuid) {
    this.setState({
      saving: true
    })

    var index = this.state.selectedGroups.findIndex(item => { return item.uuid === uuid })
    var selected = this.state.selectedGroups

    if (index === -1) {
      return
    }

    selected.splice(index, 1)

    this.setState({
      selectedGroups: selected
    })

    var url = '/app/catalogItems/' + this.props.match.params.uuid + '/remove/group'
    await api.post(url,
      {
        group: uuid
      }
    )

    setTimeout(() => {
      this.setState({
        saving: false,
        saved: true
      })
    }, 300)
  }

  async deleteObject() {
    var url = '/app/catalogItems/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/catalogs/' + this.props.match.params.catalog)
  }

  submitHandler() {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler() {
    this.setState({ isLoading: '' })
  }

  finishUpHandler() {
    this.setState({ isLoading: '' })
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false
      })
    }
  }

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  findInCatalogs(slug) {
    let find = false
    defaultCatalogs.map(item => {
      if (item.value === slug) {
        find = true
      }
    })
    return find
  }

  render() {
    if (this.state.notFound) {
      return <NotFound msg={'este ' + this.props.match.params.uuid} />
    }

    let { loaded, canEdit } = this.state
    if (!loaded) {
      return <Loader />
    }

    let catalog = {
      name: this.state.catalog.name,
      externalId: '' + this.state.catalog.externalId
    }

    const availableList = this.state.groups.filter(item => {
      return (this.state.selectedGroups.findIndex(group => {
        return group.uuid === item.uuid
      }) === -1)
    })

    let groupField
    if (testRoles('analyst') || testRoles('orgadmin')) {
      groupField = <div className='column'>
        <div className='columns'>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  <FormattedMessage
                    id="catalog.groups"
                    defaultMessage={`Grupos`}
                  />
                </p>
                <div>
                  {this.getSavingMessage()}
                </div>
              </header>
              <div className='card-content'>
                <Multiselect
                  availableTitle={this.formatTitle('multi.available')}
                  assignedTitle={this.formatTitle('multi.assigned')}
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
      </div>
    }

    return (
      <div className='detail-page'>
        <div className='section-header'>
          <h2>{catalog.name}</h2>
        </div>

        <div className='level'>
          <div className='level-left'>
            <div className='level-item'>

              <Breadcrumb
                path={[
                  {
                    path: '/',
                    label: this.formatTitle('sideMenu.admin'),
                    current: true
                  },
                  {
                    path: '/catalogs/' + this.props.match.params.catalog,
                    label: this.formatTitle('sideMenu.catalogs'),
                    current: true
                  },
                  {
                    path: '/catalogs/' + this.props.match.params.catalog,
                    label: this.formatTitle('catalogs.' + this.props.match.params.catalog),
                    current: false
                  },
                  {
                    path: '/catalogs/',
                    label: catalog.name,
                    current: true
                  }
                ]}
                align='left'
              />
            </div>
          </div>
          <div className='level-right'>
            <div className='level-item'>
              {canEdit &&
                <DeleteButton
                  titleButton={this.formatTitle('catalog.delete')}
                  objectName={this.formatTitle('catalogs.' + this.props.match.params.catalog)}
                  objectDelete={this.deleteObject.bind(this)}
                  message={this.formatTitle('catalog.deleteMsg')}
                />
              }
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
                      id="catalog.detail"
                      defaultMessage={`Detalle`}
                    />
                  </p>
                </header>
                <div className='card-content'>
                  <div className='columns'>
                    <div className='column'>
                      <ChannelForm
                        baseUrl='/app/catalogItems'
                        url={'/app/catalogItems/' + this.props.match.params.uuid}
                        initialState={catalog}
                        load={this.load.bind(this)}
                        canEdit={canEdit}
                        submitHandler={(data) => this.submitHandler(data)}
                        errorHandler={(data) => this.errorHandler(data)}
                        finishUp={(data) => this.finishUpHandler(data)}
                      >
                        <div className='field is-grouped'>
                          <div className='control'>
                            <button
                              className={'button is-primary ' + this.state.isLoading}
                              disabled={!!this.state.isLoading}
                              type='submit'
                            >
                              <FormattedMessage
                                id="catalog.btnSave"
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
    )
  }
}

export default Page({
  path: '/catalogs/:catalog/:uuid',
  title: 'Catalog Detail',
  exact: true,
  roles: 'analyst, orgadmin, admin, consultor-level-2, manager-level-2, consultor-level-3, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: injectIntl(CatalogDetail)
})
