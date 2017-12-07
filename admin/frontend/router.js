import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom'

import AdminLayout from '~components/admin-layout'

import LogIn from './pages/log-in'
import Dashboard from './pages/dashboard'
import ResetPassword from './pages/reset-password'
import EmailResetLanding from './pages/emails/reset'
import Users from './pages/users/list'
import UserDetail from './pages/users/detail'
import Profile from './pages/profile'
import Organizations from './pages/organizations/list'
import OrganizationDetail from './pages/organizations/detail'
import Roles from './pages/roles/list'
import RoleDetail from './pages/roles/detail'
import Groups from './pages/groups/list'
import GroupDetail from './pages/groups/detail'
import DataSets from './pages/datasets/list'
import DeletedDataSets from './pages/datasets/list-deleted'
import ReadyDataSets from './pages/datasets/list-ready'
import DataSetDetail from './pages/datasets/detail'
import Projects from './pages/projects/list'
import ProjectDetail from './pages/projects/detail'
import DeletedProjects from './pages/projects/deleted-list'
import SalesCenters from './pages/salesCenters/list'
import SalesCenterDetail from './pages/salesCenters/detail'
import DeletedSalesCenters from './pages/salesCenters/deleted-list'
import RequestLogs from './pages/request-logs/list'
import Products from './pages/products/list'
import ProductDetail from './pages/products/detail'
import DeletedProducts from './pages/products/deleted-list'
import ForecastDetail from './pages/forecasts/detail'

const NoMatch = () => {
  return <div>Not Found</div>
}

const AppRouter = () => {
  return (<Router>
    <AdminLayout>
      <div className='c-flex-1 is-flex is-flex-column is-relative'>
        <Switch>
          {LogIn.asRouterItem()}
          {ResetPassword.asRouterItem()}
          {EmailResetLanding.asRouterItem()}
          {Dashboard.asRouterItem()}
          {Profile.asRouterItem()}

          {Users.asRouterItem()}
          {UserDetail.asRouterItem()}

          {Organizations.asRouterItem()}
          {OrganizationDetail.asRouterItem()}

          {Roles.asRouterItem()}
          {RoleDetail.asRouterItem()}

          {Groups.asRouterItem()}
          {GroupDetail.asRouterItem()}

          {DataSets.asRouterItem()}
          {DeletedDataSets.asRouterItem()}
          {ReadyDataSets.asRouterItem()}
          {DataSetDetail.asRouterItem()}

          {Projects.asRouterItem()}
          {DeletedProjects.asRouterItem()}
          {ProjectDetail.asRouterItem()}

          {SalesCenters.asRouterItem()}
          {DeletedSalesCenters.asRouterItem()}
          {SalesCenterDetail.asRouterItem()}

          {Products.asRouterItem()}
          {DeletedProducts.asRouterItem()}
          {ProductDetail.asRouterItem()}

          {ForecastDetail.asRouterItem()}

          {RequestLogs.asRouterItem()}
          <Route component={NoMatch} />
        </Switch>
      </div>
    </AdminLayout>
  </Router>)
}

export default AppRouter
