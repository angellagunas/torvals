import React from 'react'
import { Route, Redirect } from 'react-router-dom'
import _ from 'lodash'

import env from '~base/env-variables'
import { withTracker, trackPage } from '~base/components/with-tracker'

class Context {
  throw(status, message) {
    this.hasError = true
    this.error = { status, message }
  }

  redirect(uri) {
    this.hasRedirect = true
    this.redirectTo = uri
  }
}

export default function (options = {}) {
  return {
    getOptions: () => options,
    asSidebarItem: () => {
      const ctx = new Context()

      if (options.validate) {
        if (_.isArray(options.validate)) {
          for (var validate of options.validate) {
            if (!ctx.hasError || !ctx.hasRedirect) {
              validate(ctx, options)
            }
          }
        } else {
          options.validate(ctx, options)
        }
      }

      if (ctx.hasError || ctx.hasRedirect) {
        return null
      }

      return {
        title: options.title,
        icon: options.icon,
        to: options.path,
        roles: options.roles,
        exact: options.exact
      }
    },
    asRouterItem: () => {
      return <Route exact={options.exact} path={env.PREFIX + options.path} render={props => {
        const ctx = new Context()
        const location = window.location.pathname + window.location.search
        const Component = withTracker(options.component, options.tracker)

        if (options.validate) {
          if (_.isArray(options.validate)) {
            for (var validate of options.validate) {
              if (!ctx.hasError || !ctx.hasRedirect) {
                validate(ctx, options)
              }
            }
          } else {
            options.validate(ctx, options)
          }
        }

        if (ctx.hasError) {
          console.log('should error with', ctx.error)
          trackPage(location, { hasError: ctx.hasError, error: ctx.error })
          return <div>Has error {ctx.error.status}</div>
        }

        if (ctx.hasRedirect) {
          console.log('should redirect to', ctx.redirectTo)
          trackPage(location, { hasRedirect: ctx.hasRedirect, redirectTo: ctx.redirectTo })

          return <Redirect to={{pathname: env.PREFIX + ctx.redirectTo}} />
        }

        return <Component {...props} />
      }} />
    }
  }
}
