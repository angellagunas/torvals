import React from 'react'
import {
  BrowserRouter as Router
} from 'react-router-dom'

import AdminLayout from '~components/admin-layout'

import {PrivateRoute, LoginRoute} from '~base/router'

import LogIn from './pages/log-in'
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
        <PrivateRoute exact path='/' component={Dashboard} />
        <PrivateRoute exact path='/manage/users' component={Users} />
        <PrivateRoute exact path='/manage/users/:uuid' component={UserDetail} />
        <PrivateRoute exact path='/manage/profile' component={Profile} />
        <PrivateRoute exact path='/manage/groups' component={Groups} />
        <PrivateRoute exact path='/manage/groups/:uuid' component={GroupDetail} />
      </div>
    </AdminLayout>
  </Router>)
}

export default AppRouter
