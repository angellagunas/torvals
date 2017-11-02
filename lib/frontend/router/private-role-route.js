import React from 'react'
import {
  Route,
  Redirect
} from 'react-router-dom'

import env from '~base/env-variables'
import tree from '~core/tree'

function testRoles (roles) {
  if (!roles) return true
  let rolesList = roles.split(',')
  let currentRole = tree.get('role')
  let test = false

  for (var role of rolesList) {
    role = role.trim()
    if (role && currentRole && currentRole.slug === role) {
      test = true
    }
  }

  return test
}

const PrivateRoleRoute = ({ component: Component, ...rest }) => {
  var path = rest.path
  if (env.PREFIX) {
    path = env.PREFIX + path
  }

  let role = tree.get('role')
  if (!role) {
    return <Route {...rest} path={path} render={props => {
      return <Redirect to={{
        pathname: env.PREFIX + '/'
      }} />
    }} />
  }

  if (!testRoles(rest.roles)) {
    return <Route {...rest} path={path} render={props => {
      return <Redirect to={{
        pathname: env.PREFIX + '/'
      }} />
    }} />
  }

  return <Route {...rest} path={path} render={props => {
    if (!tree.get('loggedIn') && !tree.get('organization')) {
      return <Redirect to={{
        pathname: env.PREFIX + '/log-in'
      }} />
    } else {
      return <Component {...props} />
    }
  }} />
}

export default PrivateRoleRoute
