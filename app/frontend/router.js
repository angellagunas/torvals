import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom'

import AdminLayout from '~components/admin-layout'

import LogIn from './pages/log-in'
import Dashboard from './pages/dashboard'
import Users from './pages/users/list'
import UserDetail from './pages/users/detail'
import Profile from './pages/profile'
import Groups from './pages/groups/list'
import GroupDetail from './pages/groups/detail'
import OrganizationDetail from './pages/organizations/detail'
import EmailInviteLanding from './pages/emails/invited'
import EmailResetLanding from './pages/emails/reset'
import ResetPassword from './pages/reset-password'
import DataSets from './pages/datasets/list'
import DataSetDetail from './pages/datasets/detail'
import ReadyDataSets from './pages/datasets/list-ready'
import Projects from './pages/projects/list'
import ProjectDetail from './pages/projects/detail'
import SalesCenters from './pages/salesCenters/list'
import SalesCenterDetail from './pages/salesCenters/detail'
import Products from './pages/products/list'
import ProductDetail from './pages/products/detail'
import Forecasts from './pages/forecasts/list'
import ForecastDetail from './pages/forecasts/detail'
import env from '~base/env-variables'

const NoMatch = () => {
  if (window.location.pathname === '/') {
    return <Redirect to={{pathname: env.PREFIX + 'dashboard'}} />
  }
  return (<div>Not Found</div>)
}

const AppRouter = () => {
  return (<Router>
    <AdminLayout>
      <div className='c-flex-1 is-flex is-flex-column is-relative'>
        <Switch>
          {LogIn.asRouterItem()}
          {ResetPassword.asRouterItem()}
          {EmailResetLanding.asRouterItem()}
          {EmailInviteLanding.asRouterItem()}
          {Dashboard.asRouterItem()}
          {Profile.asRouterItem()}

          {Users.asRouterItem()}
          {UserDetail.asRouterItem()}

          {OrganizationDetail.asRouterItem()}

          {Groups.asRouterItem()}
          {GroupDetail.asRouterItem()}

          {DataSets.asRouterItem()}
          {ReadyDataSets.asRouterItem()}
          {DataSetDetail.asRouterItem()}

          {Projects.asRouterItem()}
          {ProjectDetail.asRouterItem()}

          {SalesCenters.asRouterItem()}
          {SalesCenterDetail.asRouterItem()}

          {Products.asRouterItem()}
          {ProductDetail.asRouterItem()}

          {Forecasts.asRouterItem()}
          {ForecastDetail.asRouterItem()}

          <Redirect from='/' to='/dashboard' />
          <Route component={NoMatch} />
        </Switch>
      </div>
    </AdminLayout>
  </Router>)
}

export default AppRouter
