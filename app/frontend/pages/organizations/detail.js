import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import OrganizationForm from './form'
import NotFound from '~base/components/not-found'
import moment from 'moment'
import Tabs from '~base/components/base-tabs'
import BillingForm from './billing-form'
import OrgUsers from './org-users'
import { toast } from 'react-toastify'
import Labels from './labels'
import Alerts from './alerts'

class OrganizationDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      organization: {},
      isLoading: '',
      selectedTab: '0',
      activateModal: ''
    }

    this.orgStatus = {
      'trial': this.formatTitle('organizations.orgStatusTrial'),
      'active': this.formatTitle('organizations.orgStatusActive'),
      'inactive': this.formatTitle('organizations.orgStatusInactive'),
      'activationPending': this.formatTitle('organizations.orgStatusActivationPending')
    }
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  componentWillMount () {
    this.context.tree.set('organizations', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    this.context.tree.commit()
    this.load()
  }

  async load () {
    var url = '/app/organizations/' + this.props.match.params.uuid

    try {
      const body = await api.get(url)

      this.setState({
        organization: body.data,
        loaded: true,
        loading: false
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
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

  daysLeft (org) {
    let status = this.orgStatus[org.status]
    let color = ''
    let msg = ''
    let en = ''
    let start = org.billingStart
    let end = org.billingEnd

    if (org.status === 'trial') {
      color = 'has-text-success has-text-weight-semibold'
      en = this.formatTitle('organizations.connector1')
      start = org.trialStart
      end = org.trialEnd
    } else if (org.status === 'active') {
      color = 'has-text-success has-text-weight-semibold'
    } else if (org.status === 'inactive') {
      color = 'has-text-danger has-text-weight-semibold'
      msg = this.formatTitle('organizations.daysLeftMessage')
    } else if (org.status === 'activationPending') {
      color = 'has-text-warning has-text-weight-semibold'
    }

    let days = moment.utc(end).diff(moment.utc(start), 'days')

    return (
      <div className='organization-daysleft is-clearfix'>
        <h2 className="is-pulled-left">
          <FormattedMessage
            id='organizations.daysLeftAccount'
            defaultMessage={`Tu cuenta se encuentra`}
          /> {en} <span className={color}>{status}</span></h2>
        {org.status !== 'active' &&
          <button className='button is-primary is-medium is-pulled-right'
            disabled={!!this.state.isLoading}
            onClick={() => this.toggleModal()}
          >
            <FormattedMessage
              id='organizations.activateModalBtn'
              defaultMessage={`Solicitar activación`}
            />
          </button>
        }
        {/*
                <h1>
                  {days} <FormattedMessage
                    id='organizations.daysLeftDays'
                    defaultMessage={`días restantes`}
                  />
                  <span className={color}>{msg}</span></h1>
                <p>
                  <FormattedMessage
                    id='organizations.connector2'
                    defaultMessage={`Del`}
                  /> <strong>
                    {moment.utc(start).format('DD/MM/YYYY')}
                  </strong> <FormattedMessage
                    id='organizations.connector3'
                    defaultMessage={`al`}
                  /> <strong>
                    {moment.utc(end).format('DD/MM/YYYY')}
                  </strong>
                </p>
        */ }
      </div>
    )
  }

  async requestActivation () {
    this.setState({
      isLoading: ' is-loading'
    })
    try {
      let url = '/app/organizations/' + this.state.organization.uuid + '/request-activation'
      let res = await api.post(url, {})

      if (res.success) {
        this.setState({
          organization: {
            ...this.state.organization,
            status: 'activationPending'
          }
        })
        this.toggleModal()
        this.notify(this.formatTitle('organizations.activateSuccessMsg'), 5000, toast.TYPE.INFO)
      }
      return true
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      this.setState({
        isLoading: ''
      })
      return false
    }
  }

  toggleModal () {
    this.setState({
      activateModal: this.state.activateModal === '' ? ' is-active' : ''
    })
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false
      })
    }
  }

  render () {
    const { organization } = this.state

    if (this.state.notFound) {
      return <NotFound msg={this.formatTitle('organizations.notFound')} />
    }

    if (!organization.uuid || !this.state.loaded) {
      return <Loader />
    }

    this.tabs = [
      {
        name: '0',
        title: this.formatTitle('organizations.tabOrganizationsTitle'),
        hide: false,
        disabled: false,
        content: (
          <div className='section pad-sides has-20-margin-top'>
            <OrganizationForm
              baseUrl='/app/organizations'
              url={'/app/organizations/' + this.props.match.params.uuid}
              initialState={this.state.organization}
              load={this.load.bind(this)}
              submitHandler={(data) => this.submitHandler(data)}
              errorHandler={(data) => this.errorHandler(data)}
              finishUp={(data) => this.finishUpHandler(data)}
            />
          </div>
        )
      },
      { /*
        name: '1',
        title: this.formatTitle('organizations.tabFacturacionTitle'),
        hide: false,
        disabled: false,
        content: (
          <div className='section pad-sides has-20-margin-top'>
            <BillingForm org={organization} />
          </div>
        )
      },
      { */
        name: '2',
        title: this.formatTitle('organizations.tabUsersTitle'),
        hide: false,
        disabled: false,
        content: (
          <div className='section pad-sides has-20-margin-top'>
            <OrgUsers org={organization} />
          </div>
        )
      },
      { /*
        name: '3',
        title: this.formatTitle('organizations.tabLabelsTitle'),
        hide: false,
        disabled: false,
        content: (
          <div className='section pad-sides has-20-margin-top'>
            <Labels org={organization} />
          </div>
        )
      },
      {
        name: '4',
        title: this.formatTitle('organizations.tabAlertsTitle'),
        hide: false,
        disabled: false,
        content: (
          <div className='section pad-sides has-20-margin-top'>
            <Alerts org={organization} />
          </div>
        )
      */}
    ]
    return (

      <div className='organization'>
        <div className='section-header'>
          <h2>
            <FormattedMessage
              id='organizations.title'
              defaultMessage={`Organización`}
            />
          </h2>
        </div>
        <div className='card'>
          <div className='card-content'>
            {this.state.unsaved &&
              <button
                className={'button is-pulled-right is-success save-btn ' + this.state.isLoading}
                disabled={!!this.state.isLoading}
                onClick={() => { this.saveData() }}
              >
                <FormattedMessage
                  id='organizations.btnSaveConf'
                  defaultMessage={`Guardar configuración`}
                />
              </button>
            }
            {this.daysLeft(organization)}
          </div>
        </div>

        <Tabs
          tabs={this.tabs}
          selectedTab={this.state.selectedTab}
          className='is-fullwidth'
        />

        <div className={'modal organization-modal ' + this.state.activateModal}>
          <div className='modal-background' onClick={() => this.toggleModal()} />
          <div className='modal-card'>
            <header className='modal-card-head'>
              <p className='modal-card-title'>
                <FormattedMessage
                  id='organizations.activateModalTitle'
                  defaultMessage={`Solicitud de activación de cuenta`}
                />
              </p>
              <button className='delete' aria-label='close' onClick={() => this.toggleModal()} />
            </header>
            <section className='modal-card-body'>
              <p className='is-padding-bottom-small'>
                <FormattedMessage
                  id='organizations.activateModalBilling'
                  defaultMessage={`Revisa que tus datos de facturación sean correctos.`}
                />
              </p>
              <BillingForm org={organization} isModal />
              <br />
              <div className={'message is-primary'}>
                <div className='message-body is-size-7 has-text-centered'>
                  <FormattedMessage
                    id='organizations.activateModalMsg'
                    defaultMessage={`Al momento de solicitar una activación de cuenta, un agente recibirá tus datos y se comunicará posteriormente.`}
                  />
                </div>
              </div>
              <button className='button is-success is-pulled-right'
                disabled={!!this.state.isLoading}
                onClick={() => this.requestActivation()}
              >
                <FormattedMessage
                  id='organizations.activateModalBtn'
                  defaultMessage={`Solicitar activación`}
                />
              </button>
            </section>

          </div>
        </div>
      </div>
    )
  }
}

OrganizationDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedOrganizationDetail = branch({organizations: 'organizations'}, OrganizationDetail)

export default Page({
  path: '/manage/organizations/:uuid',
  title: 'User details',
  exact: true,
  roles: 'admin, orgadmin, analyst, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: injectIntl(branchedOrganizationDetail)
})
