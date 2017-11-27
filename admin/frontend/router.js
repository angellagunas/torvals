import React from 'react'
import {
  BrowserRouter as Router
} from 'react-router-dom'

import AdminLayout from '~components/admin-layout'

import {PrivateRoute, LoginRoute} from '~base/router'

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

const AppRouter = () => {
  return (<Router>
    <AdminLayout>
      <div className='c-flex-1 is-flex is-flex-column is-relative'>
        <LoginRoute exact path='/log-in' component={LogIn} />
        <LoginRoute exact path='/password/forgotten' component={ResetPassword} />
        <LoginRoute exact path='/emails/reset' component={EmailResetLanding} />
        <PrivateRoute exact path='/' component={Dashboard} />
        <PrivateRoute exact path='/manage/users' component={Users} />
        <PrivateRoute exact path='/manage/users/:uuid' component={UserDetail} />
        <PrivateRoute exact path='/profile' component={Profile} />
        <PrivateRoute exact path='/manage/organizations' component={Organizations} />
        <PrivateRoute exact path='/manage/organizations/:uuid' component={OrganizationDetail} />
        <PrivateRoute exact path='/manage/roles' component={Roles} />
        <PrivateRoute exact path='/manage/roles/:uuid' component={RoleDetail} />
        <PrivateRoute exact path='/manage/groups' component={Groups} />
        <PrivateRoute exact path='/manage/groups/:uuid' component={GroupDetail} />
        <PrivateRoute exact path='/datasets' component={DataSets} />
        <PrivateRoute exact path='/datasets/detail/:uuid' component={DataSetDetail} />
        <PrivateRoute exact path='/datasets/deleted' component={DeletedDataSets} />
        <PrivateRoute exact path='/datasets/ready' component={ReadyDataSets} />
        <PrivateRoute exact path='/projects' component={Projects} />
        <PrivateRoute exact path='/projects/detail/:uuid' component={ProjectDetail} />
        <PrivateRoute exact path='/projects/deleted' component={DeletedProjects} />
        <PrivateRoute exact path='/salesCenters' component={SalesCenters} />
        <PrivateRoute exact path='/salesCenters/detail/:uuid' component={SalesCenterDetail} />
        <PrivateRoute exact path='/salesCenters/deleted' component={DeletedSalesCenters} />
        <PrivateRoute exact path='/devtools/request-logs' component={RequestLogs} />
        <PrivateRoute exact path='/products' component={Products} />
        <PrivateRoute exact path='/products/deleted' component={DeletedProducts} />
        <PrivateRoute exact path='/products/detail/:uuid' component={ProductDetail} />
        <PrivateRoute exact path='/forecasts/detail/:uuid' component={ForecastDetail} />
      </div>
    </AdminLayout>
  </Router>)
}

export default AppRouter
