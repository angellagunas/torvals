import React, { Component } from 'react'
import api from '~base/api'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import { ToastContainer } from 'react-toastify'

import DeleteButton from '~base/components/base-deleteButton'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import Tabs from '~base/components/base-tabs'
import TabDatasets from './detail-tabs/tab-datasets'
import TabHistorical from './detail-tabs/tab-historical'
import TabAprove from './detail-tabs/tab-aprove'
import SidePanel from '~base/side-panel'
import CreateDataSet from './create-dataset'
import TabAdjustment from './detail-tabs/tab-adjustments'

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {},
      selectedTab: 'Ajustes',
      datasetClassName: ''
    }
    this.intervalo = null
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

  async getProjectStatus () {
    const url = '/admin/projects/' + this.state.project.uuid
    let res = await api.get(url)

    if (res) {
      this.setState({
        project: res.data
      })

      if (res.data.status === 'adjustment'){
        clearInterval(this.intervalo)
      }
    }
  }

  componentWillUnmount () {
    clearInterval(this.intervalo)
  }
  render () {
    const { project } = this.state

    if (this.intervalo === null && (project.status === 'processing' || project.status === 'pendingRows')) {
      this.intervalo = setInterval(() => this.getProjectStatus(), 30000)
    }

    if (!this.state.loaded) {
      return <Loader />
    }
    const tabs = [      
      {
        name: 'Ajustes',
        title: 'Ajustes',
        icon: 'fa-cogs',
        content: (
          <TabAdjustment
            project={project}
            history={this.props.history}
          />
        )
      },
      {
        name: 'Aprobar',
        title: 'Aprobar',
        icon: 'fa-calendar-check-o',
        content: (
          <TabAprove project={project} />
        )
      },
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
      /* {
        name: 'Historico',
        title: 'Historico',
        icon: 'fa-history',
        content: <TabHistorical />
      }, */
      {
        name: 'Configuración',
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
                editable
              >
                <div className='field is-grouped'>
                  <div className='control'>
                    <button className='button is-primary'>Guardar</button>
                  </div>
                </div>
              </ProjectForm>
            </div>
          </div>
      )}
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
          <div className='section is-paddingless-top pad-sides'>
            <div className='columns is-padding-top-small'>
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
        
        <ToastContainer />
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
