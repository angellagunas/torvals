import ReactGA from 'react-ga'
import moment from 'moment'

import env from '~base/env-variables'
import tree from '~core/tree'

ReactGA.initialize(env.ANALITYCS_ID)

export function trackPage(page, options = {}) {
  const user = tree.get('user') || {}
  const org = tree.get('organization') || {}

  ReactGA.set({
    page: page || window.location.pathname + window.location.search,
    start: moment().format('DD/MM/YYYY HH:mm:ss'),
    userName: user.name,
    userEmail: user.email,
    userIsAdmin: user.isAdmin,
    orgSlug: org.slug,
    orgStatus: org.status,
    ...options,
  })

  ReactGA.pageview(page)
}

export default trackPage
