import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
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
import TabAnomalies from './detail-tabs/tab-anomalies'
import CreateProject from './create'
import { consolidateStreamedStyles } from 'styled-components';

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
      modalClassName: '',
      isUpdating: '',
      roles: 'admin, orgadmin, analyst, manager-level-3',
      canEdit: false,
      isLoading: '',
      counterAdjustments: 0,
      isConciliating: '',
      modified: 0,
      pendingChanges: 0,
      pending: 0,
      pendingDataRows: {},
      showFinishBtn: false
    }

    this.interval = null
    this.intervalCounter = null
    this.intervalConciliate = null
    this.rules = tree.get('rule')
  }

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  async componentWillMount () {
    this.setState({
      selectedTab: 'ajustes',
      actualTab: 'ajustes'
    })

    await this.load()
  }

  async load (tab) {
    var url = '/app/projects/' + this.props.match.params.uuid

    try {
      const body = await api.get(url)
      const projectStatus = body.data.status
      const currentRoleIsManagerLevel1 = currentRole === 'manager-level-1'

      const projectStatusIsIn = (statuses) => _.includes(statuses, projectStatus)

      if (!tab && !currentRoleIsManagerLevel1) {
        if (projectStatus === 'empty') {
          tab = 'datasets'
        }
        else if (
          projectStatusIsIn(['pendingRows', 'processing', 'conciliating','adjustment'])
        ) {
          tab = 'ajustes'
        }
        else if (projectStatus === 'pending-configuration') {
          this.datasetDetail = body.data.mainDataset
          tab = 'datasets'
        }
        else if (projectStatus === 'updating-rules') {
          tab = 'datasets'
        }
        else {
          tab = this.state.selectedTab
        }
      }

      else if (!tab && currentRoleIsManagerLevel1) {
        tab = 'ajustes'
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
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
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

  setAlert (type, data) {
    this.setState({
      alertMsg: data,
      alertType: type
    })
  }

  async handleAllAdjustmentRequest(showMessage=true, isConfirmed=false) {}
  async handleAdjustmentRequest(obj, showMessage, finishAdjustments=false) {}

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

  render () {
    const { project, canEdit } = this.state

    if (!this.state.loaded) {
      return <Loader />
    }

    const tabs = [
      {
        name: 'ajustes',
        title: this.formatTitle('tabs.adjustments'),
        reload: false,
        hide: project.status === 'empty' ||
              project.status === 'updating-rules' ||
              project.status === 'pending-configuration',
        content: (
          <TabAdjustment
            showedFinishBtn={this.state.showFinishBtn}
            showFinishBtn={showFinishBtn => {
              this.setState({ showFinishBtn })
            }}
            load={() => {}.bind(this)}
            project={project}
            history={this.props.history}
            canEdit={canEdit}
            setAlert={(type, data) => this.setAlert(type, data)}
            pendingDataRows={() => {}}
            handleAdjustmentRequest={(row) => { this.handleAdjustmentRequest(row) }}
            handleAllAdjustmentRequest={() => { this.handleAllAdjustmentRequest() }}
            selectedTab={this.state.actualTab}
            adjustmentML1={this.state.adjustmentML1}
            rules={this.rules}
          />
        )
      }
    ]

    return (
      <div>
        <Tabs
          onChangeTab={(tab) => this.setState({ actualTab: tab})}
          tabTitle={project.name}
          tabs={tabs}
          selectedTab={this.state.selectedTab}
          className='sticky-tab'/>
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
  path: '/projects/basic',
  title: 'Proyecto',
  exact: true,
  validate: [loggedIn],
  component: injectIntl(BranchedProjectDetail)
})
