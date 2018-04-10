import React, { Component } from 'react'
import api from '~base/api'

import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ChannelForm from './create-form'
import DeleteButton from '~base/components/base-deleteButton'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'
import Multiselect from '~base/components/base-multiselect'
import FontAwesome from 'react-fontawesome'
import { ToastContainer, toast } from 'react-toastify'

class ChannelDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      channel: {},
      isLoading: '',
      groups: [],
      selectedGroups: []
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/admin/channels/' + this.props.match.params.uuid
    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        channel: body.data,
        selectedGroups: [...body.data.groups]
      })

      this.loadGroups(this.state.channel.organization.uuid)
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async loadGroups (uuid) {
    var url = '/admin/groups'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0,
        organization: uuid
      }
    )

    this.setState({
      ...this.state,
      groups: body.data
    })
  }
  getSavingMessage () {
    let {saving, saved} = this.state

    if (saving) {
      return (
        <p className='card-header-title' style={{fontWeight: '200', color: 'grey'}}>
          Guardando <span style={{paddingLeft: '5px'}}><FontAwesome className='fa-spin' name='spinner' /></span>
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
        <p className='card-header-title' style={{fontWeight: '200', color: 'grey'}}>
          Guardado
        </p>
      )
    }
  }

  async availableGroupOnClick (uuid) {
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

    var url = '/admin/channels/' + this.props.match.params.uuid + '/add/group'

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

  async assignedGroupOnClick (uuid) {
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

    var url = '/admin/channels/' + this.props.match.params.uuid + '/remove/group'
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

  async deleteObject () {
    var url = '/admin/channels/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/catalogs/channels')
  }

  getColumns () {
    return [
      {
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      }
    ]
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finishUpHandler () {
    this.setState({ isLoading: '' })
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
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

  render () {
    if (this.state.notFound) {
      return <NotFound msg='este canal' />
    }

    if (!this.state.loaded) {
      return <Loader />
    }

    let channel = {
      name: this.state.channel.name,
      organization: this.state.channel.organization.uuid,
      externalId: this.state.channel.externalId
    }

    const availableList = this.state.groups.filter(item => {
      return (this.state.selectedGroups.findIndex(group => {
        return group.uuid === item.uuid
      }) === -1)
    })

    return (
      <div className='columns c-flex-1 is-marginless'>
        <ToastContainer />
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/admin',
                  label: 'Inicio',
                  current: false
                },
                {
                  path: '/admin/catalogs/channels',
                  label: 'Canales',
                  current: false
                },
                {
                  path: '/admin/catalogs/channels/detail/',
                  label: 'Detalle',
                  current: true
                },
                {
                  path: '/admin/catalogs/channels/detail/',
                  label: channel.name,
                  current: true
                }
              ]}
              align='left'
            />
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <DeleteButton titleButton={'Borrar'}
                      objectName='Producto'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`Estas seguro de quieres borrar el canal ${channel.name}?`}
                      />
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Canal
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <ChannelForm
                          baseUrl='/admin/channels'
                          url={'/admin/channels/' + this.props.match.params.uuid}
                          initialState={channel}
                          load={this.load.bind(this)}
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
                              >Guardar</button>
                            </div>
                          </div>
                        </ChannelForm>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='column'>
                <div className='columns'>
                  <div className='column'>
                    <div className='card'>
                      <header className='card-header'>
                        <p className='card-header-title'>
                          Grupos
                        </p>
                        <div>
                          {this.getSavingMessage()}
                        </div>
                      </header>
                      <div className='card-content'>
                        <Multiselect
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
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/catalogs/channels/detail/:uuid',
  title: 'Channel Detail',
  exact: true,
  validate: loggedIn,
  component: ChannelDetail
})
