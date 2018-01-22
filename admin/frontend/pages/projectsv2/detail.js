import React, { Component } from 'react'
import api from '~base/api'
import Link from '~base/router/link'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import moment from 'moment'

import DeleteButton from '~base/components/base-deleteButton'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import BaseModal from '~base/components/base-modal'
import CreateDataSet from './create-dataset'
import Tabs from '~base/components/base-tabs'

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {},
      datasetClassName: '',
      forecastClassName: '',
      datasets: [],
      selectedTab: 'General'
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

  async deleteObject () {
    var url = '/admin/projects/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/projects')
  }

  async removeDatasetOnClick (uuid) {
    var url = `/admin/projects/${this.state.project.uuid}/remove/dataset`
    await api.post(url, { dataset: uuid })
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
    this.props.history.push('/admin/datasets/detail/' + object.uuid)
  }

  render () {
    const { project } = this.state

    if (!this.state.loaded) {
      return <Loader />
    }
    const tabs = [
      {
        name: 'General',
        title: 'Información',
        icon: 'fa-tasks',
        headButton: '',
        content:
          <ProjectForm
            baseUrl='/admin/projects'
            url={'/admin/projects/' + this.props.match.params.uuid}
            initialState={{ ...project, organization: project.organization.uuid }}
            load={this.load.bind(this)}
          >
            <div className='field is-grouped'>
              <div className='control'>
                <button className='button is-primary'>Guardar</button>
              </div>
            </div>
          </ProjectForm>
      },
      {
        name: 'Datasets',
        title: 'Datasets',
        icon: 'fa-signal',
        headButton:
          <div className={project.status !== 'empty' ? 'card-header-select no-hidden' : 'is-hidden'}>
            <button className='button is-primary' onClick={() => this.showModalDataset()}>
              <span className='icon'>
                <i className='fa fa-plus-circle' />
              </span>
              <span>
                Agregar Dataset
              </span>
            </button>
          </div>,
        content: 
        <div>
          <div className={project.status === 'empty' ? 'columns no-hidden' : 'is-hidden'}>
            <div className='column'>
              <article className='message is-warning'>
                <div className='message-header'>
                  <p>Atención</p>
                </div>
                <div className='message-body has-text-centered is-size-5'>
                  Necesitas subir y configurar al menos un <strong> dataset </strong> para tener información disponible
                              <br />
                  <br />
                  <a className='button is-large is-primary' onClick={() => this.showModalDataset()}>
                    <span className='icon is-medium'>
                      <i className='fa fa-plus-circle' />
                    </span>
                    <span>Agregar Dataset</span>
                  </a>
                </div>
              </article>
            </div>
          </div>
          <div className='columns'>
            <div className='column'>
              <BranchedPaginatedTable
                branchName='datasets'
                baseUrl='/admin/datasets/'
                columns={this.getColumns()}
                filters={{ project: project.uuid }}
              />
            </div>
          </div>
        </div>  
      },
      {
        name: 'Ajustes',
        title: 'Ajustes',
        icon: 'fa-cogs',
        headButton: '',
        content: <div>Ajustes</div>
      },
      {
        name: 'Historial',
        title: 'Historial',
        icon: 'fa-history',
        headButton: '',
        content: <div>Historial</div>
      }

    ]
    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top'>
            <div className='columns is-padding-top-small is-padding-bottom-small'>
              <div className='column'>
                <h1 className='is-size-3'>{project.name}</h1>
              </div>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <DeleteButton
                      objectName='Project'
                      objectDelete={this.deleteObject.bind(this)}
                      message={'Estas seguro de querer eliminar este Project?'}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Tabs
              tabs={tabs}
              selectedTab={this.state.selectedTab}
            />

          </div>
        </div>
        <CreateDataSet
          branchName='datasets'
          url='/admin/datasets'
          organization={project.organization.uuid}
          project={project.uuid}
          className={this.state.datasetClassName}
          hideModal={this.hideModalDataset.bind(this)}
          finishUp={this.finishUpDataset.bind(this)}
        />
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

export default Page({
  path: '/projectsv2/detail/:uuid',
  title: 'Project detail',
  exact: true,
  validate: loggedIn,
  component: BranchedProjectDetail
})
