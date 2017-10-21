import React from 'react'
import {
  Route,
  Redirect
} from 'react-router-dom'

import env from '~base/env-variables'
import tree from '~core/tree'

const PrivateRoleRoute = ({ component: Component, ...rest }) => {
  var path = rest.path
  if (env.PREFIX) {
    path = env.PREFIX + path
  }
  // console.log(rest)
  var role = rest.role
  var user = tree.get('user')

  if (user && user.role && user.role.slug !== role) {
    console.log('Unauthorized user!')
    return <Route {...rest} path={path} render={props => {
      return <Redirect to={{
        pathname: env.PREFIX + '/'
      }} />
    }} />
  }

  if (user && !user.role) {
    console.log('No role assigned to user!')
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
