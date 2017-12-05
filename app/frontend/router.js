import React from 'react'
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom'

import AdminLayout from '~components/admin-layout'

import {AppPrivateRoute, LoginRoute, PrivateRoleRoute} from '~base/router'

import LogIn from './pages/log-in'
import Dashboard from './pages/app'
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
import ProductsDetail from './pages/products/detail'
import Forecasts from './pages/forecasts/list'
import ForecastDetail from './pages/forecasts/detail'

const AppRouter = () => {
  return (<Router>
    <AdminLayout>
      <div className='c-flex-1 is-flex is-flex-column is-relative'>
        <Route exact path='/emails/invite' component={EmailInviteLanding} />
        <Route exact path='/emails/reset' component={EmailResetLanding} />
        <Route exact path='/password/forgotten' component={ResetPassword} />
        <LoginRoute exact path='/log-in' component={LogIn} />
        <AppPrivateRoute exact path='/profile' component={Profile} />
        <AppPrivateRoute exact path='/' component={Dashboard} />
        <PrivateRoleRoute
          exact
          path='/manage/users'
          component={Users}
          roles='admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/manage/users/:uuid'
          component={UserDetail}
          roles='admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/manage/groups'
          component={Groups}
          roles='admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/manage/groups/:uuid'
          component={GroupDetail}
          roles='admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/manage/organizations/:uuid'
          component={OrganizationDetail}
          roles='admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/datasets'
          component={DataSets}
          roles='supervisor, analista, admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/datasets/:uuid'
          component={DataSetDetail}
          roles='supervisor, analista, admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/datasets/ready'
          component={ReadyDataSets}
          roles='supervisor, analista, admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/projects'
          component={Projects}
          roles='supervisor, analista, admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/projects/:uuid'
          component={ProjectDetail}
          roles='supervisor, analista, admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/salesCenters'
          component={SalesCenters}
          roles='supervisor, analista, admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/salesCenters/:uuid'
          component={SalesCenterDetail}
          roles='supervisor, analista, admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/products'
          component={Products}
          roles='supervisor, analista, admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/products/:uuid'
          component={ProductsDetail}
          roles='supervisor, analista, admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/forecasts/:uuid'
          component={ForecastDetail}
          roles='supervisor, analista, admin-organizacion, admin'
        />
        <PrivateRoleRoute
          exact
          path='/forecasts'
          component={Forecasts}
          roles='supervisor, analista, admin-organizacion, admin'
        />
      </div>
    </AdminLayout>
  </Router>)
}

export default AppRouter
