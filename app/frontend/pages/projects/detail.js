import React, { Component } from 'react'
import api from '~base/api'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import { ToastContainer } from 'react-toastify'
import { testRoles } from '~base/tools'
import DeleteButton from '~base/components/base-deleteButton'
import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import Tabs from '~base/components/base-tabs'
import TabDatasets from './detail-tabs/tab-datasets'
import TabHistorical from './detail-tabs/tab-historical'
import TabAprove from './detail-tabs/tab-aprove'
import SidePanel from '~base/side-panel'
import CreateDataSet from './create-dataset'
import TabAdjustment from './detail-tabs/tab-adjustments'
import TabAnomalies from './detail-tabs/tab-anomalies'

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {},
      selectedTab: 'ajustes',
      datasetClassName: '',
      roles: 'admin, orgadmin, analyst, manager-level-2',
      canEdit: false,
      isLoading: '',
      counterAdjustments: 0
    }
    this.interval = null
    this.intervalCounter = null
  }

  async componentWillMount () {
    const user = this.context.tree.get('user')
    if (user.currentRole.slug === 'manager-level-1' && this.props.match.params.uuid !== user.currentProject.uuid) {
      this.props.history.replace('/projects/' + user.currentProject.uuid)
    }

    await this.load()
    this.setState({
      canEdit: testRoles(this.state.roles)
    })
    this.intervalCounter = setInterval(() => {
      if (this.state.project.status !== 'adjustment') return
      this.countAdjustmentRequests()
    }, 10000)
  }

  async load (tab) {
    var url = '/app/projects/' + this.props.match.params.uuid
    const body = await api.get(url)

    if (body.data.status === 'empty') {
      tab = 'datasets'
    }

    this.setState({
      loading: false,
      loaded: true,
      project: body.data,
      selectedTab: tab || this.state.selectedTab
    })

    this.countAdjustmentRequests()
  }

  async countAdjustmentRequests () {
    if (this.state.project.activeDataset) {
      var url = '/app/adjustmentRequests/counter/' + this.state.project.activeDataset.uuid
      var body = await api.get(url)
      if (this.state.counterAdjustments !== body.data.created) {
        this.setState({
          counterAdjustments: body.data.created
        })
      }
    }
  }

  async deleteObject () {
    var url = '/app/projects/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/projects')
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
    this.props.history.push('/datasets/' + object.uuid)
  }

  async getProjectStatus () {
    const url = '/app/projects/' + this.state.project.uuid
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
    clearInterval(this.intervalCounter)
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
    const { project, canEdit } = this.state

    if (this.interval === null && (project.status === 'processing' || project.status === 'pendingRows')) {
      this.interval = setInterval(() => this.getProjectStatus(), 30000)
    }

    if (!this.state.loaded) {
      return <Loader />
    }
    const tabs = [
      {
        name: 'ajustes',
        title: 'Ajustes',
        icon: 'fa-cogs',
        reload: false,
        hide: project.status === 'empty',
        content: (
          <TabAdjustment
            load={this.getProjectStatus.bind(this)}
            project={project}
            history={this.props.history}
            canEdit={canEdit}
            setAlert={(type, data) => this.setAlert(type, data)}
          />
        )
      },
      {
        name: 'aprobar',
        title: 'Aprobar',
        badge: true,
        valueBadge: this.state.counterAdjustments,
        icon: 'fa-calendar-check-o',
        reload: true,
        hide: (testRoles('manager-level-1') ||
              project.status === 'processing' ||
              project.status === 'pendingRows' ||
              project.status === 'empty'),
        content: (
          <TabAprove
            setAlert={(type, data) => this.setAlert(type, data)}
            project={project}
            canEdit={canEdit}
          />
        )
      },
      {
        name: 'datasets',
        title: 'Datasets',
        icon: 'fa-signal',
        hide: testRoles('manager-level-1'),
        reload: true,
        content: (
          <TabDatasets
            project={project}
            history={this.props.history}
            canEdit={canEdit}
            setAlert={(type, data) => this.setAlert(type, data)}
            reload={() => this.load()}
          />
        )
      },
      {
        name: 'anomalias',
        title: 'Anomalias',
        icon: 'fa-exclamation-triangle',
        reload: true,
        hide: (testRoles('manager-level-1') ||
          project.status === 'processing' ||
          project.status === 'pendingRows' ||
          project.status === 'empty'),
        content: (
          <TabAnomalies
            project={project}
            reload={(tab) => this.load(tab)}
          />
        )
      },
      {
        name: 'Historico',
        title: 'Historico',
        icon: 'fa-history',
        hide: (testRoles('manager-level-1') ||
          project.status === 'processing' ||
          project.status === 'pendingRows' ||
          project.status === 'empty'),
        content: (
          <TabHistorical
            project={project}
          />
        )
      },
      {
        name: 'configuracion',
        title: 'Configuración',
        icon: 'fa-tasks',
        hide: testRoles('manager-level-1'),
        reload: true,
        content: (
          <div>
            <div className='section'>
              <ProjectForm
                className='is-shadowless'
                baseUrl='/app/projects'
                url={'/app/projects/' + this.props.match.params.uuid}
                initialState={{ ...project, organization: project.organization.uuid }}
                load={this.load.bind(this)}
                canEdit={canEdit}
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
        )
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
          {
            this.state.alertMsg &&
            <div className={'notification has-text-centered is-uppercase is-paddingless ' + this.state.alertType}>
              <span className='icon is-medium has-text-info'>
                <i className='fa fa-warning' />
              </span>
              {this.state.alertMsg}
            </div>
          }
          <div className='section is-paddingless-top pad-sides'>
            <div className='is-padding-top-small'>
              <Tabs
                tabTitle={project.name}
                tabs={tabs}
                selectedTab={this.state.selectedTab}
                className='is-right'
                extraTab={
                canEdit &&
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

        { canEdit &&
          <SidePanel
            sidePanelClassName={project.status !== 'empty' ? 'searchbox' : 'is-hidden'}
            icon={'plus'}
            title={'Opciones'}
            content={options}
          />
        }
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
  path: '/projects/:uuid',
  title: 'Detalle de Proyecto',
  exact: true,
  roles: 'manager-level-3, analyst, orgadmin, admin, manager-level-2, manager-level-1',
  validate: [loggedIn, verifyRole],
  component: BranchedProjectDetail
})
