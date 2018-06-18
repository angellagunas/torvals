import React, { Component } from 'react'
import api from '~base/api'
import Loader from '~base/components/spinner'
import FontAwesome from 'react-fontawesome'
import Link from '~base/router/link'
import moment from 'moment'
import classNames from 'classnames'
import tree from '~core/tree'

import DeleteButton from '~base/components/base-deleteButton'
import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import PredictionsGraph from './predictions-graph'
import ContainerTable from './components/container-table'
import { ToastContainer } from 'react-toastify'
import Breadcrumb from '~base/components/base-breadcrumb'

class ForecastDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isHeaderOpen: false,
      bodyHeight: 0,
      loading: true,
      loaded: false,
      forecast: {},
      graphDataFiltered: [],
      graphProductSelected: '',
      graphIsPristine: true,
      reloadPredictions: false
    }

    this.toastId = null
  }

  componentWillMount () {
    this.load()
    this.interval = setInterval(() => this.load(), 30000)
  }

  componentWillUnmount () {
    clearInterval(this.interval)
  }

  async loadPredictions () {
    this.setState({reloadPredictions: true})
    setTimeout(() => { this.setState({reloadPredictions: false}) }, 100)
  }
  /*
   * Endpoints Call
   */

  async load () {
    var url = '/app/forecasts/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      forecast: body.data,
      graphDataFiltered: body.data.graphData
    })
  }

  async loadDatasetsList () {
    var url = '/app/datasets/'
    const body = await api.get(url, {
      start: 0,
      limit: 10,
      project: this.state.project.uuid
    })

    var cursor = this.context.tree.select('datasets')

    cursor.set({
      page: 1,
      totalItems: body.total,
      items: body.data,
      pageLength: 10
    })
    this.context.tree.commit()
  }

  async deleteObject () {
    var url = '/app/forecasts/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push(`/projects/${this.state.forecast.project.uuid}`)
  }

  async changeStatusOnClick (status) {
    var url = '/app/forecasts/change/' + this.props.match.params.uuid
    await api.post(url, {status: status})
    this.props.history.push('/forecasts')
  }

  /*
   * Columns for tables
   */

  getColumnsDatasets () {
    return [
      {
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/datasets/detail/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Status',
        'property': 'status',
        'default': 'new',
        'sortable': true
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          return (
            <div className='field is-grouped'>
              <div className='control'>
                <Link className='button' to={'/datasets/detail/' + row.uuid}>
                  Detalle
                </Link>
              </div>
            </div>
          )
        }
      }
    ]
  }

  getColumnsAdjustmentRequests () {
    let currentRole = tree.get('user').currentRole.slug

    return [
      {
        'title': 'Requested By',
        'property': 'requestedBy',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/manage/users/detail/' + row.requestedBy.uuid}>
              {row.requestedBy.name}
            </Link>
          )
        }
      },
      {
        'title': 'Status',
        'property': 'status',
        'default': 'created',
        'sortable': true
      },
      {
        'title': 'Adjustment',
        'property': 'newAdjustment',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          if (
              row.status === 'created' &&
              currentRole !== 'analyst' &&
            currentRole !== 'consultor-level-3'
          ) {
            return (
              <div className='field is-grouped'>
                <div className='control'>
                  <button
                    className='button is-success'
                    onClick={() => { this.approveRequestOnClick(row.uuid) }}
                  >
                    Aprobar
                  </button>
                </div>
                <div className='control'>
                  <button
                    className='button is-danger'
                    onClick={() => { this.rejectRequestOnClick(row.uuid) }}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            )
          }

          if (row.status === 'approved') {
            return (
              <span>
                <span style={{paddingRight: '5px'}}>
                  Approved by:
                </span>
                <Link to={'/manage/users/detail/' + row.approvedBy.uuid}>
                  {row.approvedBy.name}
                </Link>
              </span>
            )
          }

          if (row.status === 'rejected') {
            return (
              <span>
                <span style={{paddingRight: '5px'}}>
                  Rejected by:
                </span>
                <Link to={'/manage/users/detail/' + row.rejectedBy.uuid}>
                  {row.rejectedBy.name}
                </Link>
              </span>
            )
          }
        }
      }
    ]
  }

  /*
   * Editable table methods
   */

  getElementsById (array, property) {
    let seen = {}
    let out = []
    let len = array.length
    let j = 0
    let i = 0

    for (i; i < len; i++) {
      let item = array[i][property]
      if (seen[item] !== 1) {
        seen[item] = 1
        out[j++] = item
      }
    }
    return out
  }

  handleGraphFilters (e) {
    let graphDataFiltered = this.state.forecast.graphData
    if (e.target.value) {
      graphDataFiltered = this.state.forecast.graphData.filter(item => item.producto_id === e.target.value)
    }

    this.setState({
      graphProductSelected: e.target.value,
      graphIsPristine: false,
      graphDataFiltered
    })
  }

  getTable () {
    const { forecast } = this.state

    if (forecast.status === 'created' || forecast.status === 'processing') {
      return (
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Predictions
            </p>
          </header>
          <div className='card-content'>
            <div className='message is-success'>
              <div className='message-body is-large has-text-centered'>
                <div className='columns'>
                  <div className='column'>
                    <span className='icon is-large'>
                      <FontAwesome className='fa-3x fa-spin' name='cog' />
                    </span>
                  </div>
                </div>
                <div className='columns'>
                  <div className='column'>
                    The predictions will appear shortly...
                    They are being generated as we speak
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    clearInterval(this.interval)

    if (forecast.status === 'error') {
      return (
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Predictions
            </p>
          </header>
          <div className='card-content'>
            <div className='message is-danger'>
              <div className='message-body is-large has-text-centered'>
                <div className='columns'>
                  <div className='column'>
                    <span className='icon is-large'>
                      <FontAwesome className='fa-3x' name='warning' />
                    </span>
                  </div>
                </div>
                <div className='columns'>
                  <div className='column'>
                    There was an error while processing the forecast, please contact an administrator
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (

      <div>
        {forecast.status === 'analistReview' && (
          <div className='columns'>
            <div className='column'>
              <PredictionsGraph match={this.props.match} />
            </div>
          </div>
        )}
        {this.getAdjustmentRequestList()}
        <div className='columns'>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Predictions Table
                </p>
              </header>

              <ContainerTable forecast={this.state.forecast} reload={this.state.reloadPredictions} />
            </div>
          </div>
        </div>
        {this.getDatasetsList()}
      </div>
    )
  }

  /*
   * Rendering methods
   */

  getFrequency () {
    let forecast = this.state.forecast
    let freqDict = {
      B: 'Business day frequency',
      D: 'Calendar day frequency',
      W: 'Weekly frequency',
      M: 'Month end frequency'
    }

    return freqDict[forecast.frequency]
  }

  getButtons () {
    let currentRole = tree.get('user').currentRole.slug
    const { forecast } = this.state

    if (forecast.status === 'analistReview') {
      return (
        <button
          className='button is-primary'
          type='button'
          onClick={() => this.changeStatusOnClick('opsReview')}
        >
          Aprobar
        </button>
      )
    }

    if (
      forecast.status === 'opsReview' &&
      (currentRole === 'manager-level-1' || currentRole === 'manager-level-2')
    ) {
      return (
        <button
          className='button is-primary'
          type='button'
          onClick={() => this.changeStatusOnClick('consolidate')}
        >
          Consolidar
        </button>
      )
    }

    if (
      forecast.status === 'consolidate' &&
      (currentRole === 'manager-level-1' || currentRole === 'manager-level-2')
    ) {
      return (
        <button
          className='button is-primary'
          type='button'
          onClick={() => this.changeStatusOnClick('consolidate')}
        >
          Listo para pedido
        </button>
      )
    }
  }

  getDatasetsList () {
    const { forecast } = this.state
    return (
      <div className='columns'>
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Datasets
              </p>
            </header>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>
                  <BranchedPaginatedTable
                    branchName='datasets'
                    baseUrl='/app/datasets/'
                    columns={this.getColumnsDatasets()}
                    filters={{project: forecast.project.uuid}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /*
   * AdjustmentRequest methods
   */

  async finishUpAdjustmentRequest (obj) {
    this.setState({
      selectedAR: undefined
    })

    await this.loadPredictions()
  }

  async approveRequestOnClick (uuid) {
    const { forecast } = this.state
    var url = '/app/adjustmentRequests/approve/' + uuid
    await api.post(url)

    const cursor = tree.get('adjustmentRequests')
    const adjustmentRequests = await api.get(
      '/app/adjustmentRequests/',
      {forecast: forecast.uuid}
    )

    await this.loadPredictions()

    tree.set('adjustmentRequests', {
      page: cursor.page,
      totalItems: adjustmentRequests.total,
      items: adjustmentRequests.data,
      pageLength: cursor.pageLength
    })
    tree.commit()
  }

  async rejectRequestOnClick (uuid) {
    const { forecast } = this.state
    var url = '/app/adjustmentRequests/reject/' + uuid
    await api.post(url)

    const cursor = tree.get('adjustmentRequests')
    const adjustmentRequests = await api.get(
      '/app/adjustmentRequests/',
      {forecast: forecast.uuid}
    )

    tree.set('adjustmentRequests', {
      page: cursor.page,
      totalItems: adjustmentRequests.total,
      items: adjustmentRequests.data,
      pageLength: cursor.pageLength
    })
    tree.commit()
  }

  getAdjustmentRequestList () {
    const { forecast } = this.state
    if (forecast.status === 'consolidate') {
      return (
        <div className='columns'>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                Adjustment Requests
              </p>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='adjustmentRequests'
                      baseUrl='/app/adjustmentRequests/'
                      columns={this.getColumnsAdjustmentRequests()}
                      filters={{forecast: forecast.uuid}}
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

  /*
   * Sticky header methods
   */

  setHeights (elements) {
    const scrollBody = elements || document.querySelectorAll('[data-content]')

    scrollBody.forEach((sticky) => {
      let bottom = sticky.getBoundingClientRect().bottom
      const footerHeight = 0
      const viewporHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      this.setState({bodyHeight: viewporHeight - (bottom + footerHeight)})
    })
  }

  toggleHeader () {
    this.setState({isHeaderOpen: !this.state.isHeaderOpen}, function () {
      this.setHeights()
    })
  }

  getHeight (element) {
    if (this.state.bodyHeight === 0) {
      if (element) this.setHeights([element])
    }
  }

  render () {
    let currentRole = tree.get('user').currentRole.slug
    const { forecast } = this.state
    const headerBodyClass = classNames('card-content', {
      'is-hidden': this.state.isHeaderOpen === false
    })
    const toggleBtnIconClass = classNames('fa', {
      'fa-plus': this.state.isHeaderOpen === false,
      'fa-minus': this.state.isHeaderOpen !== false
    })

    if (!forecast.uuid) {
      return <Loader />
    }

    return (<div>
      <div data-content className='card' id='test' ref={(element) => this.getHeight(element)}>
        <header className='card-header'>
          <p className='card-header-title'>
            Forecast from {moment.utc(forecast.dateStart).format('DD/MM/YYYY')} to {moment.utc(forecast.dateEnd).format('DD/MM/YYYY')}
          </p>

          <div className='field is-grouped is-grouped-right card-header-select'>
            <div className='control'>
              <Link
                className='button is-light'
                to={'/projects/' + forecast.project.uuid}
              >
                Return to project
              </Link>
            </div>
            <div className='control'>
              {this.getButtons()}

            </div>
            <div className='control'>
              <a
                className='button is-rounded is-inverted'
                onClick={() => this.toggleHeader()}>
                <span className='icon is-small'>
                  <i className={toggleBtnIconClass} />
                </span>
              </a>
            </div>
          </div>
        </header>
        <div className={headerBodyClass}>
          <div className='columns is-multiline'>
            <div className='column is-6'>
              <strong>Status:</strong> {forecast.status}
            </div>
            <div className='column is-6'>
              <strong>Organization:</strong> {forecast.organization.name}
            </div>
            <div className='column is-6'>
              <strong>Start Date:</strong> {moment.utc(forecast.dateStart).format('DD/MM/YYYY')}
            </div>
            <div className='column is-6'>
              <strong>End Date:</strong> {moment.utc(forecast.dateEnd).format('DD/MM/YYYY')}
            </div>
            <div className='column is-6'>
              <strong>Frequency:</strong> {this.getFrequency()}
            </div>
            <div className='column is-6'>
              <strong>Created By:</strong> {`${forecast.createdBy.name}`}
            </div>
            <div className='column is-6 is-offset-6'>
              <div className='control'>
                { currentRole !== 'manager-level-1' &&
                  <DeleteButton
                    objectName='Forecast'
                    objectDelete={this.deleteObject.bind(this)}
                    message={`¿Estas seguro de querer eliminar el objeto`}
                  />
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer />
      <div className='columns c-flex-1 is-marginless' style={{overflowY: 'scroll', height: this.state.bodyHeight}}>
        <div className='column is-12 is-paddingless'>
          <div className='section'>
            <Breadcrumb
              path={[
                {
                  path: '/',
                  label: 'Inicio',
                  current: false
                },
                {
                  path: '/forecasts',
                  label: 'Forecasts',
                  current: false
                },
                {
                  path: '/forecasts/',
                  label: 'Detalle',
                  current: true
                }
              ]}
              align='left'
            />
            {this.getTable()}
          </div>
        </div>
      </div>
    </div>)
  }
}

export default Page({
  path: '/forecasts/:uuid',
  title: 'Forecast detail',
  icon: 'check',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin, manager-level-1, consultor-level-2, manager-level-2',
  validate: [loggedIn, verifyRole],
  component: ForecastDetail
})
