import ReactGA from 'react-ga'
import env from '~base/env-variables'
import cookies from '~base/cookies'

ReactGA.initialize(env.ANALYTICS_ID)

function getUserInfo() {
  const name = cookies.get('name') || 'Orax Visitor'
  const uuid = cookies.get('_user')
  const org = cookies.get('organization') || 'Orax Visitor'

  return { name, uuid, org }
}

export function trackEvent(action, options = {}) {
  const { name, uuid, org } = getUserInfo()

  ReactGA.event({
    action,
    category: org.slug,
    label: `${name} - ${uuid}`,
    ...options
  })
}

export function trackPage(page) {
  const pageView = page || window.location.pathname + window.location.search

  ReactGA.pageview(pageView)

  trackEvent(`Page view - ${pageView}`)
}

export default trackPage
