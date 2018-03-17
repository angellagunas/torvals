import React, { Component } from 'react'
import api from '~base/api'
import moment from 'moment'
import Link from '~base/router/link'
import FontAwesome from 'react-fontawesome'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import Multiselect from '~base/components/base-multiselect'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
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
      selectedGroups: [],
      saving: false,
      saved: false,
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/admin/salesCenters/' + this.props.match.params.uuid
    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        salesCenter: body.data,
        selectedGroups: [...body.data.groups]
      })

      this.loadGroups(body.data)
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async loadGroups (salesCenter) {
    var url = '/admin/groups/'
    const body = await api.get(
      url,
      {
        salesCenter: salesCenter.uuid,
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

    var url = '/admin/salesCenters/' + this.props.match.params.uuid + '/add/group'
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

    var url = '/admin/salesCenters/' + this.props.match.params.uuid + '/remove/group'
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
    var url = '/admin/salesCenters/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/salesCenters')
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
          return (
            <Link className='button' to={'/forecasts/detail/' + row.uuid}>
              Detalle
            </Link>
          )
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

    if (!this.state.loaded) {
      return <Loader />
    }

    const availableList = this.state.groups.filter(item => {
      return (this.state.selectedGroups.findIndex(group => {
        return group.uuid === item.uuid
      }) === -1)
    })

    return (
      <div className='columns c-flex-1 is-marginless'>
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
                  path: '/admin/salesCenters',
                  label: 'Centros de venta',
                  current: false
                },
                {
                  path: '/admin/salesCenters/detail/',
                  label: 'Detalle',
                  current: true
                },
                {
                  path: '/admin/salesCenters/detail/',
                  label: this.state.salesCenter.name,
                  current: true
                }
              ]}
              align='left'
            />
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <DeleteButton
                      titleButton={'Eliminar'}
                      objectName='Sales Centers'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`Estas seguro de eliminar el centro de ventas ${this.state.salesCenter.name}?`}
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
                      Centro de venta
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <ProjectForm
                          baseUrl='/admin/salesCenters'
                          url={'/admin/salesCenters/' + this.props.match.params.uuid}
                          initialState={this.state.salesCenter}
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
                        </ProjectForm>
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
                      dataFormatter={(item) => { return item.name }}
                      availableClickHandler={this.availableGroupOnClick.bind(this)}
                      assignedClickHandler={this.assignedGroupOnClick.bind(this)}
                        />
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='columns'>
                  <div className='column'>
                    <div className='card'>
                      <header className='card-header'>
                        <p className='card-header-title'>
                          Predicciones
                        </p>
                      </header>
                      <div className='card-content'>
                        <div className='columns'>
                          <div className='column'>
                            <BranchedPaginatedTable
                              branchName='forecasts'
                              baseUrl='/admin/forecasts/'
                              columns={this.getColumns()}
                              filters={{salesCenter: this.state.salesCenter.uuid}}
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
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/salesCenters/detail/:uuid',
  title: 'Sales center detail',
  exact: true,
  validate: loggedIn,
  component: SalesCenterDetail
})
