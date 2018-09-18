import React, { Component } from 'react'
import ReactGA from 'react-ga'

import env from '~base/env-variables'
import tree from '~core/tree'

ReactGA.initialize(env.ANALITYCS_ID)

export function trackPage(page, options) {
  const user = tree.get('user') || {}
  const org = tree.get('organization') || {}

  ReactGA.set({
    page,
    userName: user.name,
    userEmail: user.email,
    userIsAdmin: user.isAdmin,
    orgSlug: org.slug,
    orgStatus: org.status,
    ...options,
  })

  ReactGA.pageview(page)
}

export function withTracker(WrappedComponent, options = {}) {
  const HOC = class extends Component {
    componentDidMount() {
      const { location } = this.props
      const page = location.pathname + location.search

      trackPage(page, options)
    }

    componentDidUpdate(prevProps) {
      const { location } = this.props
      const currentPage = prevProps.location.pathname + prevProps.location.search
      const nextPage = location.pathname + location.search

      if (currentPage !== nextPage) {
        trackPage(nextPage, options)
      }
    }

    render() {
      return <WrappedComponent {...this.props} />
    }
  }

  return HOC
}

export default withTracker
