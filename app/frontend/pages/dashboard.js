import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import moment from 'moment'
import tree from '~core/tree'
import _ from 'lodash'
import { FormattedMessage, injectIntl } from 'react-intl'
import api from '~base/api'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import Graph from '~base/components/graph'
import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'
import { toast } from 'react-toastify'
import Wizard from './wizard/wizard';
import Empty from '~base/components/empty'
import { defaultCatalogs, validateRegText } from '~base/tools'
import DatePicker from '~base/components/date-picker'

class Dashboard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      allProjects: false,
      totalAdjustment: 0,
      totalPrediction: 0,
      totalSale: 0,
      totalPSale: 0,
      mape: 0,
      searchTerm: '',
      sortBy: 'sale',
      sortAscending: true,
      outdated: false,
      projects: []
    }
  }

  moveTo (route) {
    this.props.history.push(route)
  }

  render () {
    return <Redirect to={'/projects/basic'} />
  }
}

Dashboard.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDashboard = branch({forecasts: 'forecasts'}, Dashboard)

export default Page({
  path: '/dashboard',
  title: 'Dashboard',
  icon: 'line-chart',
  exact: true,
  validate: loggedIn,
  component: injectIntl(branchedDashboard)
})
