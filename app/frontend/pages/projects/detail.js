import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import { ToastContainer, toast } from 'react-toastify'

import api from '~base/api'
import Page from '~base/page'
import { testRoles } from '~base/tools'
import DeleteButton from '~base/components/base-deleteButton'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import Tabs from '~base/components/base-tabs'
import SidePanel from '~base/side-panel'
import NotFound from '~base/components/not-found'

import ProjectForm from './create-form'
import TabDatasets from './detail-tabs/tab-datasets'
import TabHistorical from './detail-tabs/tab-historical'
import TabAprove from './detail-tabs/tab-aprove'
import CreateDataSet from './create-dataset'
import TabAdjustment from './detail-tabs/tab-adjustments'
// import Breadcrumb from '~base/components/base-breadcrumb'
// import TabAnomalies from './detail-tabs/tab-anomalies'

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {},
      selectedTab: 'ajustes',
      datasetClassName: '',
      roles: 'admin, orgadmin, analyst',
      canEdit: false,
      isLoading: '',
      counterAdjustments: 0,
      isConciliating: ''
    }
    this.interval = null
    this.intervalCounter = null
  }

  async componentWillMount () {
    const user = this.context.tree.get('user')
    if (user.currentRole.slug === 'manager-level-1' && this.props.match.params.uuid !== user.currentProject.uuid) {
      this.props.history.replace('/projects/' + user.currentProject.uuid)
    }

    await this.hasSaleCenter()
    await this.hasChannel()

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

    try {
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
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
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

  async hasSaleCenter () {
    let url = '/app/salesCenters'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      sort: 'name'
    })
    if (res.total <= 0 && testRoles('manager-level-1, manager-level-2')) {
      this.setState({
        noSalesCenter: true
      })
    }
  }

  async hasChannel () {
    let url = '/app/channels'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      sort: 'name'
    })
    if (res.total <= 0 && testRoles('manager-level-1, manager-level-2')) {
      this.setState({
        noChannel: true
      })
    }
  }

  async conciliateOnClick () {
    this.setState({
      isConciliating: ' is-loading'
    })

    var url = '/app/datasets/' + this.state.project.activeDataset.uuid + '/set/conciliate'
    try {
      clearInterval(this.interval)
      await api.post(url)
      await this.load()
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
    }

    this.setState({
      isConciliating: '',
      modified: 0,
      dataRows: [],
      isFiltered: false
    })
  }

  getCounters (realized, pending) {
    this.setState({
      realized: realized,
      pending: pending
    })
  }

  render () {
    if (this.state.notFound) {
      return <NotFound msg='este proyecto' />
    }

    if (this.state.noSalesCenter) {
      return (
        <div className='card-content'>
          <div className='columns'>
            <div className='column'>
              <article className='message is-warning'>
                <div className='message-header'>
                  <p>Atención</p>
                </div>
                <div className='message-body has-text-centered is-size-5'>
                  Necesitas tener asignado al menos un centro de venta para ver esta sección, ponte en contacto con tu supervisor.
            </div>
              </article>
            </div>
          </div>
        </div>
      )
    }

    if (this.state.noChannel) {
      return (
        <div className='card-content'>
          <div className='columns'>
            <div className='column'>
              <article className='message is-warning'>
                <div className='message-header'>
                  <p>Atención</p>
                </div>
                <div className='message-body has-text-centered is-size-5'>
                  Necesitas tener asignado al menos un canal para ver esta sección, ponte en contacto con tu supervisor.
            </div>
              </article>
            </div>
          </div>
        </div>
      )
    }

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
        reload: false,
        hide: project.status === 'empty',
        content: (
          <TabAdjustment
            counters={(realized, pending) => { this.getCounters(realized, pending) }}
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
      // {
      //   name: 'anomalias',
      //   title: 'Anomalias',
      //   reload: true,
      //   hide: (testRoles('manager-level-1') ||
      //     project.status === 'processing' ||
      //     project.status === 'pendingRows' ||
      //     project.status === 'empty'),
      //   content: (
      //     <TabAnomalies
      //       project={project}
      //       reload={(tab) => this.load(tab)}
      //     />
      //   )
      // },
      {
        name: 'Gráficos',
        title: 'Gráficos',
        hide: (project.status === 'processing' ||
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
      <div>
        {
          /* !testRoles('manager-level-1') &&
          <Breadcrumb
            path={[
              {
                path: '/',
                label: 'Inicio',
                current: false
              },
              {
                path: '/projects',
                label: 'Proyectos',
                current: false
              },
              {
                path: '/projects/',
                label: 'Detalle',
                current: true
              },
              {
                path: '/projects/',
                label: project.name,
                current: true
              }
            ]}
            align='left'
          /> */
        }
        <Tabs
          tabTitle={project.name}
          tabs={tabs}
          selectedTab={this.state.selectedTab}
          className='sticky-tab'
          extraTab={
            <div>
              <div className='field is-grouped'>
                <p className='control'>
                  <p className='has-text-weight-semibold'>
                    <span className='icon is-small is-transparent-text'>
                      <i className='fa fa-gears' />
                    </span>
                    Ajustes
                  </p>
                </p>
                <p className='control'>
                  <p className='has-text-success has-text-weight-semibold'>
                    <span className='icon is-small'>
                      <i className='fa fa-check' />
                    </span>
                      Realizados {this.state.realized}
                  </p>

                </p>
                <p className='control'>
                  <p className='has-text-warning has-text-weight-semibold'>
                    <span className='icon is-small'>
                      <i className='fa fa-exclamation-triangle' />
                    </span>
                        Por aprobar {this.state.pending}
                  </p>
                </p>
                <p className='control btn-conciliate'>
                  <a className={'button is-success ' + this.state.isConciliating}
                    disabled={!!this.state.isConciliating}
                    onClick={e => this.conciliateOnClick()}>
                      Consolidar
                  </a>
                </p>
              </div>
              {canEdit &&
                <DeleteButton
                  objectName='Proyecto'
                  objectDelete={() => this.deleteObject()}
                  message={'Estas seguro de querer eliminar este Proyecto?'}
                />
                }
            </div>
          }
        />

        {
          testRoles('manager-level-1') && project.status === 'empty' &&
          <div className='card-content'>
            <div className='columns'>
              <div className='column'>
                <article className='message is-warning'>
                  <div className='message-header'>
                    <p>Atención</p>
                  </div>
                  <div className='message-body has-text-centered is-size-5'>
                    Este proyecto aún no contiene datasets, ponte en contacto con tu supervisor.
                </div>
                </article>
              </div>
            </div>
          </div>
        }

        { canEdit &&
          <SidePanel
            noListPage
            sidePanelClassName={project.status !== 'empty' ? 'sidepanel' : 'is-hidden'}
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
  title: 'Detalle',
  exact: true,
  roles: 'manager-level-3, analyst, orgadmin, admin, manager-level-2, manager-level-1',
  validate: [loggedIn, verifyRole],
  component: BranchedProjectDetail
})
