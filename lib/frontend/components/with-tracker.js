import ReactGA from 'react-ga'
import env from '~base/env-variables'
import tree from '~core/tree'

ReactGA.initialize(env.ANALITYCS_ID)

function getUserInfo() {
  const user = tree.get('user') || {}
  const org = tree.get('organization') || {}

  return { user, org }
}

export function trackEvent(action, options = {}) {
  const { user, org } = getUserInfo()

  ReactGA.event({
    action,
    category: org.slug || 'Orax Visitor',
    label: `${user.name} - ${user.uuid}` || 'Orax Visitor',
    ...options,
  })
}

export function trackPage(page) {
  const pageView = page || window.location.pathname + window.location.search

  ReactGA.pageview(pageView)

  trackEvent(`Page view - ${pageView}`)
}

export default trackPage
