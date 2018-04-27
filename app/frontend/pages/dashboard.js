import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import moment from 'moment'
import FontAwesome from 'react-fontawesome'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import DashOrgAdmin from './dashboards/dash-org-admin'
import DashAnalyst from './dashboards/dash-analyst'
import DashEntManager from './dashboards/dash-ent-manager'

class Dashboard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true
    }
  }

  componentWillMount () {
    this.load()
    this.context.tree.set('forecasts', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    this.context.tree.commit()
  }

  async load () {
    var url = '/app/dashboard/'
    const body = await api.get(url)

    this.setState({
      dashboard: body,
      forecasts: body.forecasts,
      forecastsCount: body.forecasts.length,
      projects: body.project,
      loading: false
    })
  }

  getColumns () {
    return [
      {
        'title': 'Status',
        'property': 'status',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Start date',
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
        'title': 'End date',
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
        'title': 'Created',
        'property': 'dateCreated',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateCreated).local().format('DD/MM/YYYY hh:mm a')
          )
        }
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          return <Link className='button' to={'/forecasts/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }

  boxOnClick (uuid) {
    this.props.history.push(`forecasts/${uuid}`)
  }

  getForecastList () {
    const {
      forecastsCount,
      forecasts
    } = this.state

    if (forecastsCount > 0) {
      return (
        <div>
          <h1 className='title'>Forecasts pendientes de revisión:</h1>
          {forecasts.map(item => {
            return (
              <div
                className='box'
                key={item.uuid}
                onClick={() => this.boxOnClick(item.uuid)}
                style={{cursor: 'pointer'}}
              >
                Forecast del {moment(item.dateStart).format('YYYY-MM-DD')} al {moment(item.dateEnd).format('YYYY-MM-DD')}, status: {item.status}
              </div>
            )
          })}
        </div>
      )
    }

    return (
      <div className='message is-success'>
        <div className='message-body is-large has-text-centered'>
          <div className='columns'>
            <div className='column'>
              <span className='icon has-text-success is-large'>
                <FontAwesome className='fa-3x' name='thumbs-up' />
              </span>
            </div>
          </div>
          <div className='columns'>
            <div className='column'>
              No hay Forecasts por revisar!
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const user = this.context.tree.get('user')

    const {
      loading
    } = this.state

    if (loading) {
      return <Loader />
    }

    if (this.state.redirect) {
      return <Redirect to='/landing' />
    }

    if (user.currentRole.slug === 'orgadmin') {
      return <DashOrgAdmin dashboard={this.state.dashboard} history={this.props.history} />
    }

    if (user.currentRole.slug === 'analyst') {
      return <DashAnalyst dashboard={this.state.dashboard} history={this.props.history} />
    }

    if (user.currentRole.slug === 'consultor' || user.currentRole.slug === 'manager-level-2') {
      return <DashEntManager dashboard={this.state.dashboard} history={this.props.history} />
    }

    if (user.currentRole.slug === 'manager-level-1') {
      return <Redirect to={'/projects/' + user.currentProject.uuid} />
    }

    return (
      <div className='section'>

        <div className='columns'>
          <div className='column'>
            {this.getForecastList()}
          </div>
        </div>
        <div className='columns'>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                    Forecasts revisados
                </p>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='forecasts'
                      baseUrl='/app/forecasts'
                      columns={this.getColumns()}
                      filters={{status: 'readyToOrder'}}
                    />
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

Dashboard.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDashboard = branch({forecasts: 'forecasts'}, Dashboard)

export default Page({
  path: '/dashboard',
  title: 'Dashboard',
  icon: 'github',
  exact: true,
  validate: loggedIn,
  component: branchedDashboard
})
