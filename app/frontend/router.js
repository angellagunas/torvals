import React from 'react'
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom'

import AdminLayout from '~components/admin-layout'

import {AppPrivateRoute, LoginRoute, PrivateRoleRoute} from '~base/router'

import LogIn from './pages/log-in'
import SelectOrg from './pages/select-org'
import Dashboard from './pages/app'
import Users from './pages/users/list'
import UserDetail from './pages/users/detail'
import Profile from './pages/profile'
import Groups from './pages/groups/list'
import GroupDetail from './pages/groups/detail'
import EmailInviteLanding from './pages/emails/invited'
import EmailResetLanding from './pages/emails/reset'
import ResetPassword from './pages/reset-password'

const AppRouter = () => {
  return (<Router>
    <AdminLayout>
      <div className='c-flex-1 is-flex is-flex-column is-relative'>
        <Route exact path='/emails/invite' component={EmailInviteLanding} />
        <Route exact path='/emails/reset' component={EmailResetLanding} />
        <Route exact path='/password/forgotten' component={ResetPassword} />
        <LoginRoute exact path='/log-in' component={LogIn} />
        <AppPrivateRoute exact path='/profile' component={Profile} />
        <AppPrivateRoute exact path='/select_org' component={SelectOrg} />
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
      </div>
    </AdminLayout>
  </Router>)
}

export default AppRouter
