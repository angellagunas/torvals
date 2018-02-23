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
import Breadcrumb from '~base/components/base-breadcrumb'

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {},
      selectedTab: 'Ajustes',
      datasetClassName: '',
      isLoading: ''
    }
    this.interval = null
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

      if (res.data.status === 'adjustment') {
        clearInterval(this.interval)
      }
    }
  }

  componentWillUnmount () {
    clearInterval(this.interval)
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

  setAlert (type, data) {
    this.setState({
      alertMsg: data,
      alertType: type
    })
  }

  render () {
    const { project } = this.state

    if (this.interval === null && (project.status === 'processing' || project.status === 'pendingRows')) {
      this.interval = setInterval(() => this.getProjectStatus(), 30000)
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
            load={this.getProjectStatus.bind(this)}
            project={project}
            history={this.props.history}
            setAlert={(type, data) => this.setAlert(type, data)}
          />
        )
      },
      {
        name: 'Aprobar',
        title: 'Aprobar',
        icon: 'fa-calendar-check-o',
        hide: project.status === 'processing' ||
              project.status === 'pendingRows' ||
              project.status === 'empty',
        content: (
          <TabAprove
            project={project}
            setAlert={(type, data) => this.setAlert(type, data)} />
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
            setAlert={(type, data) => this.setAlert(type, data)}
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
          <div>
            <div className='section'>
              <ProjectForm
                className='is-shadowless'
                baseUrl='/admin/projects'
                url={'/admin/projects/' + this.props.match.params.uuid}
                initialState={{ ...project, organization: project.organization.uuid }}
                load={this.load.bind(this)}
                editable
                submitHandler={(data) => this.submitHandler(data)}
                errorHandler={(data) => this.errorHandler(data)}
                finishUp={(data) => this.finishUpHandler(data)}
                setAlert={(type, data) => this.setAlert(type, data)}
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
          {
            this.state.alertMsg &&
            <div className={'notification has-text-centered is-uppercase is-paddingless ' + this.state.alertType}>
              <span className='icon is-medium has-text-info'>
                <i className='fa fa-warning' />
              </span>
              {this.state.alertMsg}
            </div>
          }
          <div className='section pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/admin',
                  label: 'Dashboard',
                  current: false
                },
                {
                  path: '/admin/projects',
                  label: 'Proyectos',
                  current: false
                },
                {
                  path: '/admin/projects/detail/',
                  label: 'Detalle de proyecto',
                  current: true
                }
              ]}
              align='left'
            />
            <div className='is-padding-top-small'>
              <Tabs
                tabTitle={project.name}
                tabs={tabs}
                selectedTab={this.state.selectedTab}
                className='is-right is-medium'
                extraTab={
                  <DeleteButton
                    objectName='Proyecto'
                    objectDelete={() => this.deleteObject()}
                    message={'Estas seguro de querer eliminar este Proyecto?'}
                  />
                }
              />
            </div>
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
          finishUp={this.finishUpDataset.bind(this)}
        />

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
