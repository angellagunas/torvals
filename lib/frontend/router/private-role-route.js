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
  let user = tree.get('user')
  let test = false

  for (var role of rolesList) {
    role = role.trim()
    if (role && user && user.role && user.role.slug === role) {
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

  let user = tree.get('user')
  if (user && !user.role) {
    console.log('No role assigned to user!')
    return <Route {...rest} path={path} render={props => {
      return <Redirect to={{
        pathname: env.PREFIX + '/'
      }} />
    }} />
  }

  if (!testRoles(rest.roles)) {
    console.log('Unauthorized user!')
    return <Route {...rest} path={path} render={props => {
      return <Redirect to={{
        pathname: env.PREFIX + '/'
      }} />
    }} />
  }

  return <Route {...rest} path={path} render={props => {
    if (!tree.get('loggedIn')) {
      return <Redirect to={{
        pathname: env.PREFIX + '/log-in'
      }} />
    } else {
      return <Component {...props} />
    }
  }} />
}

export default PrivateRoleRoute
