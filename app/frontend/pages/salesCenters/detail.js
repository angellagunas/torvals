import React, { Component } from 'react'
import api from '~base/api'
import moment from 'moment'
import Link from '~base/router/link'
import { testRoles } from '~base/tools'
import FontAwesome from 'react-fontawesome'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import SalesCenterForm from './create-form'
import Multiselect from '~base/components/base-multiselect'
import DeleteButton from '~base/components/base-deleteButton'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'

class SalesCenterDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      salesCenter: {},
      groups: [],
      roles: 'admin, orgadmin, analyst, manager-level-3',
      canEdit: false,
      selectedGroups: [],
      saving: false,
      saved: false,
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
    this.loadGroups()
    this.setState({canEdit: testRoles(this.state.roles)})
  }

  async load () {
    var url = '/app/salesCenters/' + this.props.match.params.uuid
    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        salesCenter: body.data,
        selectedGroups: [...body.data.groups]
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async loadGroups () {
    var url = '/app/groups/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      groups: body.data
    })
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

    var url = '/app/salesCenters/' + this.props.match.params.uuid + '/add/group'
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

    var url = '/app/salesCenters/' + this.props.match.params.uuid + '/remove/group'
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
    var url = '/app/salesCenters/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/catalogs/salesCenters')
  }

  getColumns () {
    return [
      {
        'title': 'Estado',
        'property': 'status',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Fecha Inicial',
        'property': 'dateStart',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateStart).local().format('DD/MM/YYYY')
          )
        }
      },
      {
        'title': 'Fecha Final',
        'property': 'dateEnd',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateEnd).local().format('DD/MM/YYYY')
          )
        }
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          if (testRoles('manager-level-2, consultor-level-3')) {
            return (
              <Link className='button is-primary' to={'/forecasts/' + row.uuid}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </Link>
            )
          } else {
            return (
              <Link className='button is-primary' to={'/forecasts/' + row.uuid}>
                <span className='icon is-small' title='Editar'>
                  <i className='fa fa-pencil' />
                </span>
              </Link>
            )
          }
        }
      }
    ]
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

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finishUpHandler () {
    this.setState({ isLoading: '' })
  }

  render () {
    if (this.state.notFound) {
      return <NotFound msg='este centro de venta' />
    }

    let { loaded, canEdit } = this.state
    if (!loaded) {
      return <Loader />
    }

    const availableList = this.state.groups.filter(item => {
      return (this.state.selectedGroups.findIndex(group => {
        return group.uuid === item.uuid
      }) === -1)
    })

    return (
      <div className='detail-page'>
        <div className='section-header'>
          <h2>{this.state.salesCenter.name}</h2>
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
                    path: '/catalogs/salesCenters',
                    label: 'Centros de venta',
                    current: false
                  },
                  {
                    path: '/catalogs/salesCenters/',
                    label: this.state.salesCenter.name,
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
                  titleButton={'Eliminar'}
                  objectName='Centro de ventas'
                  objectDelete={this.deleteObject.bind(this)}
                  message={`¿Deseas eliminar el centro de ventas ${this.state.salesCenter.name}?`}
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
                      <SalesCenterForm
                        baseUrl='/app/salesCenters'
                        url={'/app/salesCenters/' + this.props.match.params.uuid}
                        initialState={this.state.salesCenter}
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
                      </SalesCenterForm>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='column'>
              <div className='card'>
                <header className='card-header'>
                  <p className='card-header-title'>
                      Grupos
                    </p>
                </header>
                <div className='card-content'>
                  <Multiselect
                    availableTitle='Disponible'
                    assignedTitle='Asignado'
                    assignedList={this.state.selectedGroups}
                    availableList={availableList}
                    dataFormatter={(item) => { return item.name }}
                    availableClickHandler={this.availableGroupOnClick.bind(this)}
                    assignedClickHandler={this.assignedGroupOnClick.bind(this)}
                    disabled={!canEdit}
                    />
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
  path: '/catalogs/salesCenters/:uuid',
  title: 'Sales center detail',
  exact: true,
  roles: 'analyst, orgadmin, admin, consultor-level-2, manager-level-2, consultor-level-3, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: SalesCenterDetail
})