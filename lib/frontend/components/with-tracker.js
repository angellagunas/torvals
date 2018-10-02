import ReactGA from 'react-ga'
import moment from 'moment'

import env from '~base/env-variables'
import tree from '~core/tree'

ReactGA.initialize(env.ANALITYCS_ID)

export function trackPage(page, options = {}) {
  const user = tree.get('user') || {}
  const org = tree.get('organization') || {}
  const pageView = page || window.location.pathname + window.location.search

  ReactGA.set({
    page: pageView,
    start: moment().format('DD/MM/YYYY HH:mm:ss'),
    userName: user.name,
    userEmail: user.email,
    userIsAdmin: user.isAdmin,
    orgSlug: org.slug,
    orgStatus: org.status,
    ...options,
  })

  ReactGA.event({
    category: user.name || 'Orax Visitor',
    action: `Page view - ${pageView}`,
    label: org.slug || 'Orax Visitor'
  })

  ReactGA.pageview(pageView)
}

export default trackPage
