import React, { Component } from 'react'
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

const cleanName = (item) => {
  let c = item.replace(/-/g, ' ')
  return c.charAt(0).toUpperCase() + c.slice(1)
}

class CatalogDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      catalog: {},
      roles: 'admin, orgadmin, analyst, manager-level-2',
      canEdit: false,
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
    this.setState({ canEdit: testRoles(this.state.roles) })
  }

  async load () {
    var url = '/app/catalogItems/detail/' + this.props.match.params.uuid
    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        catalog: body.data
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  getSavingMessage () {
    let { saving, saved } = this.state

    if (saving) {
      return (
        <p className='card-header-title' style={{ fontWeight: '200', color: 'grey' }}>
          Guardando <span style={{ paddingLeft: '5px' }}><FontAwesome className='fa-spin' name='spinner' /></span>
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
          Guardado
        </p>
      )
    }
  }

  async deleteObject () {
    var url = '/app/catalogItems/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/catalogs/' + this.props.match.params.catalog)
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
                    label: 'Inicio',
                    current: false
                  },
                  {
                    path: '/catalogs/' + this.props.match.params.catalog,
                    label: 'Catálogos',
                    current: true
                  },
                  {
                    path: '/catalogs/' + this.props.match.params.catalog,
                    label: cleanName(this.props.match.params.catalog),
                    current: false
                  },
                  {
                    path: '/catalogs/channels/',
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
                <DeleteButton titleButton={'Eliminar'}
                  objectName={this.props.match.params.catalog}
                  objectDelete={this.deleteObject.bind(this)}
                  message={`¿Estas seguro de quieres borrar el canal ${catalog.name}?`}
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
                    Detalle
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
                            >Guardar</button>
                          </div>
                        </div>
                      </ChannelForm>
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
  path: '/catalogs/:catalog/:uuid',
  title: 'Catalog Detail',
  exact: true,
  roles: 'analyst, orgadmin, admin, manager-level-1, manager-level-2, consultor',
  validate: [loggedIn, verifyRole],
  component: CatalogDetail
})
