import React from 'react'
import {
  BrowserRouter as Router
} from 'react-router-dom'

import AdminLayout from '~components/admin-layout'

import {PrivateRoute, LoginRoute, PrivateRoleRoute} from '~base/router'

import LogIn from './pages/log-in'
import SelectOrg from './pages/select-org'
import Dashboard from './pages/app'
import Users from './pages/users/list'
import UserDetail from './pages/users/detail'
import Profile from './pages/profile'
import Groups from './pages/groups/list'
import GroupDetail from './pages/groups/detail'

const AppRouter = () => {
  return (<Router>
    <AdminLayout>
      <div className='c-flex-1 is-flex is-flex-column is-relative'>
        <LoginRoute exact path='/log-in' component={LogIn} />
        <PrivateRoute exact path='/profile' component={Profile} />
        <PrivateRoute exact path='/select_org' component={SelectOrg} />
        <PrivateRoute exact path='/' component={Dashboard} />
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
      </div>
    </AdminLayout>
  </Router>)
}

export default AppRouter
