import React, { Component } from 'react'
import api from '~base/api'
import Link from '~base/router/link'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import moment from 'moment'

import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import CreateForecast from '../forecasts/create'
import AddDataset from './add-dataset'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {},
      datasetClassName: '',
      forecastClassName: '',
      datasets: []
    }
  }

  componentWillMount () {
    this.load().then(this.loadDatasetsAdd.bind(this))
  }

  async load () {
    var url = '/admin/projects/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      project: body.data
    })
  }

  async loadDatasetsList () {
    var url = '/admin/datasets/'
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

  async loadForecasts () {
    var url = '/admin/forecasts/'
    const body = await api.get(url, {
      start: 0,
      limit: 10,
      project: this.state.project.uuid
    })

    var cursor = this.context.tree.select('forecasts')

    cursor.set({
      page: 1,
      totalItems: body.total,
      items: body.data,
      pageLength: 10
    })
    this.context.tree.commit()
  }

  async loadDatasetsAdd () {
    let { project } = this.state
    const body = await api.get(
      '/admin/datasets',
      {
        start: 0,
        limit: 10,
        organization: project.organization.uuid,
        project__nin: project.uuid,
        status: 'ready'
      }
    )

    this.setState({
      datasets: body.data,
      loaded: true
    })
  }

  async deleteOnClick () {
    var url = '/admin/projects/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/projects')
  }

  async removeDatasetOnClick (uuid) {
    var url = `/admin/projects/${this.state.project.uuid}/remove/dataset`
    await api.post(url, {dataset: uuid})
    await this.loadDatasetsList()
    await this.loadDatasetsAdd()
  }

  getColumns () {
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
              <div className='control'>
                <button
                  className='button is-danger'
                  type='button'
                  onClick={() => this.removeDatasetOnClick(row.uuid)}
                >
                  Remove
                </button>
              </div>
            </div>
          )
        }
      }
    ]
  }

  getColumnsForecasts () {
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
        'title': 'Actions',
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

  showModalDataset () {
    this.setState({
      datasetClassName: ' is-active'
    })
  }

  hideModalDataset (e) {
    this.setState({
      datasetClassName: ''
    })
  }

  finishUpDataset (object) {
    this.setState({
      datasetClassName: ''
    })
  }

  showModalForecast () {
    this.setState({
      forecastClassName: ' is-active'
    })
  }

  hideModalForecast (e) {
    this.setState({
      forecastClassName: ''
    })
  }

  finishUpForecast (object) {
    this.setState({
      forecastClassName: ''
    })
    this.props.history.push('/admin/forecasts/detail/' + object.uuid)
  }

  render () {
    const { project } = this.state

    if (!this.state.loaded) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <button
                      className='button is-danger'
                      type='button'
                      onClick={() => this.deleteOnClick()}
                    >
                      Delete
                    </button>
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
                          Project
                        </p>
                      </header>
                      <div className='card-content'>
                        <ProjectForm
                          baseUrl='/admin/projects'
                          url={'/admin/projects/' + this.props.match.params.uuid}
                          initialState={{...project, organization: project.organization.uuid}}
                          load={this.load.bind(this)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Save</button>
                            </div>
                          </div>
                        </ProjectForm>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='columns'>
                  <div className='column'>
                    <div className='card'>
                      <header className='card-header'>
                        <p className='card-header-title'>
                          Datasets
                        </p>
                        <div className='card-header-select'>
                          <button className='button is-primary' onClick={() => this.showModalDataset()}>
                            Add Dataset
                          </button>
                          <AddDataset
                            className={this.state.datasetClassName}
                            hideModal={this.hideModalDataset.bind(this)}
                            finishUp={this.finishUpDataset.bind(this)}
                            url={`/admin/projects/${project.uuid}/add/dataset`}
                            project={project}
                            datasets={this.state.datasets}
                            load={this.loadDatasetsAdd.bind(this)}
                            loadDatasets={this.loadDatasetsList.bind(this)}
                          />
                        </div>
                      </header>
                      <div className='card-content'>
                        <div className='columns'>
                          <div className='column'>
                            <BranchedPaginatedTable
                              branchName='datasets'
                              baseUrl='/admin/datasets/'
                              columns={this.getColumns()}
                              filters={{project: project.uuid}}
                            />
                          </div>
                        </div>
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
                          Forecasts
                        </p>
                        <div className='card-header-select'>
                          <button className='button is-primary' onClick={() => this.showModalForecast()}>
                            Create Forecast
                          </button>
                          <CreateForecast
                            className={this.state.forecastClassName}
                            hideModal={this.hideModalForecast.bind(this)}
                            finishUp={this.finishUpForecast.bind(this)}
                            url={`/admin/projects/${project.uuid}/add/forecast`}
                            load={this.loadForecasts.bind(this)}
                          />
                        </div>
                      </header>
                      <div className='card-content'>
                        <div className='columns'>
                          <div className='column'>
                            <BranchedPaginatedTable
                              branchName='forecasts'
                              baseUrl='/admin/forecasts/'
                              columns={this.getColumnsForecasts()}
                              filters={{project: project.uuid}}
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

ProjectDetail.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedProjectDetail = branch((props, context) => {
  return {
    data: 'datasets'
  }
}, ProjectDetail)

export default BranchedProjectDetail
