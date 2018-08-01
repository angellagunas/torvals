import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import { toast } from 'react-toastify'

import api from '~base/api'
import Page from '~base/page'
import { testRoles } from '~base/tools'
import DeleteButton from '~base/components/base-deleteButton'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import Tabs from '~base/components/base-tabs'
import SidePanel from '~base/side-panel'
import NotFound from '~base/components/not-found'
import BaseModal from '~base/components/base-modal'
import tree from '~core/tree'

import ProjectForm from './create-form'
import TabDatasets from './detail-tabs/tab-datasets'
import TabHistorical from './detail-tabs/tab-historical'
import TabApprove from './detail-tabs/tab-approve'
import CreateDataSet from './create-dataset'
import TabAdjustment from './detail-tabs/tab-adjustments'
// import Breadcrumb from '~base/components/base-breadcrumb'
import TabAnomalies from './detail-tabs/tab-anomalies'
import CreateProject from './create'

var currentRole
var user

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {},
      selectedTab: 'graficos',
      actualTab: 'graficos',
      datasetClassName: '',
      cloneClassName: '',
      outdatedClassName: '',
      isUpdating: '',
      roles: 'admin, orgadmin, analyst, manager-level-3',
      canEdit: false,
      isLoading: '',
      counterAdjustments: 0,
      isConciliating: '',
      modified: 0,
      pendingChanges: 0,
      pending: 0,
      pendingDataRows: {}
    }

    this.interval = null
    this.intervalCounter = null
    this.intervalConciliate = null
    this.rules = tree.get('rule')
  }

  async componentWillMount () {
    user = this.context.tree.get('user')
    currentRole = user.currentRole.slug

    if (currentRole === 'manager-level-1' && this.props.match.params.uuid !== user.currentProject.uuid) {
      this.props.history.replace('/projects/' + user.currentProject.uuid)
    }

    if (currentRole === 'manager-level-1') {
      this.setState({
        selectedTab: 'ajustes',
        actualTab: 'ajustes'
      })
    }

    // await this.hasSaleCenter()
    // await this.hasChannel()
    await this.load()

    this.setState({
      canEdit: testRoles(this.state.roles)
    })

    this.intervalCounter = setInterval(() => {
      if (this.state.project.status !== 'adjustment') return
      this.countAdjustmentRequests()
    }, 10000)

    if (
      currentRole !== 'consultor-level-3' &&
      !this.intervalConciliate &&
      this.state.project.status === 'adjustment'
    ) {
      this.intervalConciliate = setInterval(() => { this.getModifiedCount() }, 10000)
    }
  }

  async load (tab) {
    var url = '/app/projects/' + this.props.match.params.uuid

    try {
      const body = await api.get(url)

      if (!tab && currentRole !== 'manager-level-1') {
        if (body.data.status === 'empty') {
          tab = 'datasets'
        }
        else if (body.data.status === 'pendingRows' || body.data.status === 'processing') {
          tab = 'ajustes'
        }
        else if (body.data.status === 'adjustment') {
          tab = 'graficos'
        }
        else if (body.data.status === 'pending-configuration') {
          this.datasetDetail = body.data.mainDataset
          tab = 'datasets'
        }
        else if (body.data.status === 'updating-rules') {
          tab = 'datasets'
        }
        else {
          tab = this.state.selectedTab
        }
      }

      else if (!tab && currentRole === 'manager-level-1') {
        tab = 'ajustes'
      }

      if (
        currentRole !== 'manager-level-1' &&
        currentRole !== 'manager-level-2' &&
        body.data.outdated &&
        body.data.status !== 'cloning' &&
        !this.state.project.uuid
      ) {
        this.showModalOutdated()
      }

      this.rules = body.data.rule

      this.setState({
        loading: false,
        loaded: true,
        project: body.data,
        selectedTab: tab,
        actualTab: tab,
        datasetDetail: this.datasetDetail
      })

      this.countAdjustmentRequests()
      this.getModifiedCount()
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
      try {
        var body = await api.get(url)
        if (this.state.counterAdjustments !== body.data.created) {
          this.setState({
            counterAdjustments: body.data.created
          })
        }
      } catch (e) {
        console.log(e)
      }
    }
  }

  async getModifiedCount () {
    if (this.state.project.activeDataset) {
      const url = '/app/rows/modified/dataset/'
      try {
        let res = await api.get(url + this.state.project.activeDataset.uuid)

        if (
          res.data.pending !== this.state.pendingChanges ||
          res.data.modified !== this.state.modified
      ) {
          if (res.data.pending > 0) {
            this.setState({
              modified: res.data.modified,
              pendingChanges: res.data.pending,
              isConciliating: ' is-loading'
            })
          } else {
            this.setState({
              modified: res.data.modified,
              pendingChanges: res.data.pending,
              isConciliating: ''
            })
          }
        }
      } catch (e) {
        console.log(e)
      }
    }
  }

  async deleteObject () {
    var url = '/app/projects/' + this.props.match.params.uuid
    try {
      await api.del(url)
      this.props.history.push('/projects')
    } catch (e) {
      console.log(e)
    }
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

  showModalClone () {
    this.setState({
      cloneClassName: ' is-active'
    })
  }

  hideModalClone (e) {
    this.setState({
      cloneClassName: ''
    })
  }

  showModalOutdated () {
    this.setState({
      outdatedClassName: ' is-active'
    })
  }

  hideModalOutdated() {
    this.setState({
      outdatedClassName: ''
    })
  }

  finishUpClone (object) {
    this.setState({
      cloneClassName: ''
    })
    this.props.history.push('/projects/' + object.uuid)
    this.load('ajustes')
  }

  async getProjectStatus () {
    const url = '/app/projects/' + this.state.project.uuid
    try {
      let res = await api.get(url)

      if (res) {
        this.setState({
          project: res.data
        })

        if (res.data.status === 'adjustment') {
          clearInterval(this.interval)
          this.interval = null

          if (!this.intervalConciliate) {
            this.intervalConciliate = setInterval(() => { this.getModifiedCount() }, 10000)
          }
        }
        else if (res.data.status === 'pending-configuration'){
          this.setState({
            selectedTab: 'datasets',
            actualTab: 'datasets',
            datasetDetail: res.data.mainDataset
          })
        }
         else {
          clearInterval(this.intervalConciliate)
          this.intervalConciliate = null

        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  componentWillUnmount () {
    clearInterval(this.interval)
    clearInterval(this.intervalCounter)
    clearInterval(this.intervalConciliate)
    this.interval = null
    this.intervalCounter = null
    this.intervalConciliate = null
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

  async hasSaleCenter() {
    if (testRoles('manager-level-1, manager-level-2')) {
      let url = '/app/salesCenters'
      try {
        let res = await api.get(url, {
          start: 0,
          limit: 0,
          sort: 'name'
        })
        if (res.total <= 0) {
          this.setState({
            noSalesCenter: true
          })
        }
      } catch (e) {
        console.log(e)
      }
    }
  }

  async hasChannel() {
    if (testRoles('manager-level-1, manager-level-2')) {
      let url = '/app/channels'
      try {
        let res = await api.get(url, {
          start: 0,
          limit: 0,
          sort: 'name'
        })
        if (res.total <= 0) {
          this.setState({
            noChannel: true
          })
        }
      } catch (e) {
        console.log(e)
      }
    }
  }

  async conciliateOnClick () {
    this.setState({
      isConciliating: ' is-loading'
    })

    var url = '/app/datasets/' + this.state.project.activeDataset.uuid + '/set/conciliate'
    try {
      clearInterval(this.interval)
      this.interval = null

      await api.post(url)
      await this.load('ajustes')
    } catch (e) {
      toast('Error: ' + e.message, {
        autoClose: 5000,
        type: toast.TYPE.ERROR,
        hideProgressBar: true,
        closeButton: false
      })
    }

    this.setState({
      isConciliating: '',
      modified: 0,
      dataRows: [],
      isFiltered: false
    })
  }

  setPendingDataRows = (rows) => {
    let pendingDataRowsArray = Object.values(rows)
    let pending = this.state.pendingDataRows

    for (let row in rows) {
      if (!pending[row]) pending[row] = rows[row]
    }

    this.setState({
      pendingDataRows: pending
    })
  }

  async handleAllAdjustmentRequest(showMessage=true) {
    this.setState({
      isConciliating: ' is-loading'
    })
    let { pendingDataRows } = this.state
    let pendingDataRowsArray = Object.values(pendingDataRows)
    let finishAdjustments = true
    await this.handleAdjustmentRequest(pendingDataRowsArray, showMessage, finishAdjustments)
    this.setState({
      isConciliating: ''
    })
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
    let className = ''
    if (type === toast.TYPE.WARNING) {
      className = 'has-bg-warning'
    }
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false,
        className: className
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false,
        className: className
      })
    }
  }

  async handleAdjustmentRequest(obj, showMessage, finishAdjustments=false) {
    let { pendingDataRows } = this.state
    let cycle = tree.get('selectedCycle')
    
    let productAux = []
    if (currentRole === 'consultor-level-3') {
      return
    }

    if (obj instanceof Array) {
      productAux = obj
    } else {
      productAux.push(obj)
    }
    let rows = productAux.filter(item => { return item.newAdjustment && item.isLimit })
    try {
      var res = await api.post('/app/rows/request', {rows: rows, finishAdjustments: finishAdjustments, cycle: cycle.uuid, dataset: this.state.project.activeDataset.uuid})
      if (currentRole === 'manager-level-1' || currentRole === 'manager-level-2') {
        this.notify('Sus ajustes se han guardado', 5000, toast.TYPE.INFO)
        if (showMessage) {
          this.setState({
            adjustmentML1: true
          })

          setTimeout(() => {this.setState({
            adjustmentML1: false
          })}, 5000)
        }
      }
    } catch (e) {
      this.notify('Ocurrio un error ' + e.message, 5000, toast.TYPE.ERROR)

      return
    }

    for (var product of productAux) {
      product.adjustmentRequest = res.data[product.uuid]
      delete pendingDataRows[product.uuid]
    }
    this.setState({
      pendingDataRows: pendingDataRows
    })
  }

  async updateProject () {
    this.setState({ isUpdating: 'is-loading' })

    const url = '/app/projects/update/businessRules'
    try {
      await api.post(url, { ...this.state.project })
      await this.load()
      this.hideModalOutdated()
    } catch (e) {
      toast('Error: ' + e.message, {
        autoClose: 5000,
        type: toast.TYPE.ERROR,
        hideProgressBar: true,
        closeButton: false
      })
    }

    this.setState({ isUpdating: '' })
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

    if (this.interval === null && (
        project.status === 'processing' ||
        project.status === 'conciliating' ||
        project.status === 'pendingRows' ||
        project.status === 'cloning' ||
        project.status === 'pending-configuration' ||
        project.status === 'updating-rules'
    )) {
      this.interval = setInterval(() => this.getProjectStatus(), 10000)
    }

    if (!this.state.loaded) {
      return <Loader />
    }

    const tabs = [
      {
        name: 'graficos',
        title: 'Gráficos',
        hide: (testRoles('manager-level-1') ||
          project.status === 'empty' ||
          project.status === 'conciliating' ||
          project.status === 'cloning' ||
          project.status === 'updating-rules' ||
          project.status === 'pending-configuration'),
        content: (
          <TabHistorical
            project={project}
            history={this.props.history}
            currentRole={currentRole}
            rules={this.rules}
          />
        )
      },
      {
        name: 'ajustes',
        title: 'Ajustes',
        reload: false,
        hide: project.status === 'empty' ||
              project.status === 'updating-rules' ||
              project.status === 'pending-configuration',
        content: (
          <TabAdjustment
            loadCounters={() => {
              this.countAdjustmentRequests()
              this.getModifiedCount()
            }}
            load={this.getProjectStatus.bind(this)}
            project={project}
            history={this.props.history}
            canEdit={canEdit}
            setAlert={(type, data) => this.setAlert(type, data)}
            pendingDataRows={this.setPendingDataRows}
            handleAdjustmentRequest={(row) => { this.handleAdjustmentRequest(row) }}
            handleAllAdjustmentRequest={() => { this.handleAllAdjustmentRequest() }}
            selectedTab={this.state.actualTab}
            adjustmentML1={this.state.adjustmentML1}
            rules={this.rules}
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
              project.status === 'empty' ||
              project.status === 'cloning' || 
              project.status === 'updating-rules' ||
              project.status === 'pending-configuration'),
        content: (
          <TabApprove
            setAlert={(type, data) => this.setAlert(type, data)}
            project={project}
            canEdit={canEdit}
          />
        )
      },
      {
        name: 'datasets',
        title: 'Datasets',
        hide: testRoles('manager-level-1, consultor-level-2, manager-level-2, consultor-level-3'),
        reload: true,
        content: (
          <TabDatasets
            project={project}
            history={this.props.history}
            canEdit={canEdit}
            setAlert={(type, data) => this.setAlert(type, data)}
            reload={(tab) => this.load(tab)}
            datasetDetail={this.state.datasetDetail}
          />
        )
      },
      {
        name: 'anomalias',
        title: 'Anomalías',
        reload: true,
        hide: (testRoles('manager-level-1') ||
          project.status === 'processing' ||
          project.status === 'pendingRows' ||
          project.status === 'empty' ||
          project.status === 'cloning' ||
          project.status === 'updating-rules' ||
          project.status === 'pending-configuration'),
        content: (
          <TabAnomalies
            project={project}
            reload={(tab) => this.load(tab)}
            rules={this.rules}
          />
        )
      },
      {
        name: 'configuracion',
        title: 'Configuración',
        hide: testRoles('manager-level-1, consultor-level-2, manager-level-2, consultor-level-3'),
        reload: true,
        content: (
          <div>
            <div className='section'>
              {testRoles('orgadmin') &&
                <CreateProject
                  url='/app/projects/clone'
                  initialState={{ ...project, organization: project.organization.uuid, clone: project.uuid }}
                  className={this.state.cloneClassName}
                  hideModal={this.hideModalClone.bind(this)}
                  finishUp={this.finishUpClone.bind(this)}
                  canEdit={canEdit}
                  title='Clonar Proyecto'
                  buttonText='Clonar'
                />
              }
              {canEdit &&
                <div className='columns is-marginless'>
                  <div className='column'>
                    <div className='is-pulled-right'>
                      <div className='field is-grouped'>
                        <div className='control'>
                          {testRoles('orgadmin') && project.mainDataset &&
                            <button
                              className='button'
                              type='button'
                              onClick={this.showModalClone.bind(this)}
                            >
                              Clonar
                            </button>
                          }
                        </div>
                        <div className='control'>
                          <DeleteButton
                            objectName='Proyecto'
                            objectDelete={() => this.deleteObject()}
                            message={'¿Estas seguro de querer eliminar este Proyecto?'}
                            hideIcon
                            titleButton={'Eliminar'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }

              <ProjectForm
                className='is-shadowless'
                baseUrl='/app/projects'
                url={'/app/projects/' + this.props.match.params.uuid}
                initialState={{ ...project, organization: project.organization.uuid }}
                load={this.load.bind(this)}
                canEdit={canEdit}
                editable
                isAdmin={testRoles('orgadmin')}
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
    var consolidarButton
    if (!testRoles('consultor-level-3, consultor-level-2, manager-level-1, manager-level-2') && this.state.actualTab === 'aprobar') {
      consolidarButton =
        <p className='control btn-conciliate'>
          <a className={'button is-success ' + this.state.isConciliating}
            disabled={!!this.state.isConciliating}
            onClick={e => this.conciliateOnClick()}>
              Consolidar
          </a>
        </p>
    }
    else if (testRoles('manager-level-1, manager-level-2')) {
      consolidarButton =
        <p className='control btn-conciliate'>
          <a className={'button is-success ' + this.state.isConciliating}
            disabled={!!this.state.isConciliating}
            onClick={e => this.handleAllAdjustmentRequest()}>
            Finalizar
          </a>
        </p>
    }

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
          onChangeTab={(tab) => this.setState({ actualTab: tab})}
          tabTitle={project.name}
          tabs={tabs}
          selectedTab={this.state.selectedTab}
          className='sticky-tab'
          extraTab={
                project.status === 'adjustment' &&
                <div>
                  <div className='field is-grouped'>
                    <p className='control'>
                      <span className='has-text-weight-semibold'>
                        <span className='icon is-small is-transparent-text'>
                          <i className='fa fa-gears' />
                        </span>
                    Ajustes
                  </span>
                    </p>
                    <p className='control'>
                      <span className='has-text-success has-text-weight-semibold'>
                        <span className='icon is-small'>
                          <i className='fa fa-check' />
                        </span>
                      Realizados {this.state.modified}
                      </span>

                    </p>
                    <p className='control'>
                      <span className='has-text-warning has-text-weight-semibold'>
                        <span className='icon is-small'>
                          <i className='fa fa-exclamation-triangle' />
                        </span>
                      Por aprobar {this.state.counterAdjustments}
                      </span>
                    </p>
                    {consolidarButton}
                  </div>
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

        <CreateDataSet
          branchName='datasets'
          url='/admin/datasets'
          organization={project.organization.uuid}
          project={project.uuid}
          className={this.state.datasetClassName}
          hideModal={this.hideModalDataset.bind(this)}
          finishUp={this.finishUpDataset.bind(this)}
        />

        <BaseModal
          title='Proyecto desactualizado'
          className={this.state.outdatedClassName}
          hideModal={this.hideModalOutdated.bind(this)}
        >
          <p>
            Este proyecto se encuentra usando una version pasada de reglas de negocio,
            ¿Desea actualizarlo?
          </p> <br />
          <div className='field is-grouped'>
            <div className='control'>
              <button
                className={'button is-primary ' + this.state.isUpdating}
                disabled={!!this.state.isUpdating}
                onClick={this.updateProject.bind(this)}
              >
                Actualizar
              </button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModalOutdated.bind(this)} type='button'>
                Cancelar
              </button>
            </div>
          </div>
        </BaseModal>

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
  roles: 'consultor-level-3, analyst, orgadmin, admin, consultor-level-2, manager-level-2, manager-level-1, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: BranchedProjectDetail
})