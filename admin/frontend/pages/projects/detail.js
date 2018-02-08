import React, { Component } from 'react'
import api from '~base/api'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'

import DeleteButton from '~base/components/base-deleteButton'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import Tabs from '~base/components/base-tabs'
import TabDatasets from './detail-tabs/tab-datasets'
import TabHistorical from './detail-tabs/tab-historical'
import SidePanel from '~base/side-panel'
import CreateDataSet from './create-dataset'

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {},
      selectedTab: 'General',
      datasetClassName: ''
    }
  }

  componentWillMount () {
    this.load()
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

  async deleteObject () {
    var url = '/admin/projects/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/projects')
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
        content: (
          <div className='card'>
            <header className='card-header'><p className='card-header-title'> Información </p></header>
            <div className='card-content'>
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
            </div>
          </div>
      )},
      {
        name: 'Datasets',
        title: 'Datasets',
        icon: 'fa-signal',
        content: (
          <TabDatasets
            project={project}
            history={this.props.history}
          />
      )},
      {
        name: 'Ajustes',
        title: 'Ajustes',
        icon: 'fa-cogs',
        content: (
          <div className='card'>
            <header className='card-header'><p className='card-header-title'> Ajustes </p></header>
            <div className='card-content'>
              Ajustes
            </div>
          </div>
        )
      },
      {
        name: 'Historico',
        title: 'Historico',
        icon: 'fa-history',
        content: <TabHistorical />
      }

    ]

    let options = (<button className={'button is-primary no-hidden'}
      onClick={() => this.showModalDataset()}>
      <span className='icon'>
        <i className='fa fa-plus-circle' />
      </span>
      <span>
        Agregar Dataset
      </span>
    </button>)

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
                      objectName='Proyecto'
                      objectDelete={this.deleteObject.bind(this)}
                      message={'Estas seguro de querer eliminar este Proyecto?'}
                    />
                  </div>
                </div>
              </div>
            </div>
            <br />
            <Tabs
              tabs={tabs}
              selectedTab={this.state.selectedTab} />
          </div>
        </div>

        <SidePanel
          sidePanelClassName={project.status !== 'empty' ? 'sidepanel' : 'is-hidden'}
          icon={'plus'}
          title={'Opciones'}
          content={options} />

        <CreateDataSet
          branchName='datasets'
          url='/admin/datasets'
          organization={project.organization.uuid}
          project={project.uuid}
          className={this.state.datasetClassName}
          hideModal={this.hideModalDataset.bind(this)}
          finishUp={this.finishUpDataset.bind(this)} />

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
  path: '/projects/detail/:uuid',
  title: 'Project detail',
  exact: true,
  validate: loggedIn,
  component: BranchedProjectDetail
})
