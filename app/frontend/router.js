import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom'

import AdminLayout from '~components/admin-layout'
import LandPage from './pages/land-page'
import Dashboard from './pages/dashboard'
import Profile from './pages/profile'
import OrganizationDetail from './pages/organizations/detail'
import EmailInviteLanding from './pages/emails/invited'
import EmailResetLanding from './pages/emails/reset'
import EmailActivateLanding from './pages/emails/activate'
import ResetPassword from './pages/reset-password'
import DataSets from './pages/datasets/list'
import ReadyDataSets from './pages/datasets/list-ready'
import Projects from './pages/projects/list'
import ProjectDetail from './pages/projects/detail'
import SalesCenters from './pages/salesCenters/list'
import SalesCenterDetail from './pages/salesCenters/detail'
import Products from './pages/products/list'
import ProductDetail from './pages/products/detail'
import env from '~base/env-variables'
import Channels from './pages/channel/list'
import ChannelsDetail from './pages/channel/detail'
import NotFound from '~base/components/not-found'
import Calendar from './pages/calendar'
import Prices from './pages/prices/list'
import PriceDetail from './pages/prices/detail'
import UsersImport from './pages/import/users'
import ChannelImport from './pages/import/channels'
import ProductsImport from './pages/import/products'
import SalesCentersImport from './pages/import/sales-centers'
import CatalogRouter from './pages/catalog/router'
import CatalogDetail from './pages/catalog/detail'
import HistoricalReport from './pages/reports/historic'
import StatusReport from './pages/reports/status'
import DownloadReport from './pages/reports/download'
import OrgRules from './pages/org-rules'
import UsersGroups from './pages/users-groups'
import Roles from './pages/roles/list'
import Forecast from './pages/forecast/forecast'
import ForecastDetail from './pages/forecast/detail'
import ForecastCompare from './pages/forecast/compare'

const NoMatch = () => {
  if (window.location.pathname === '/') {
    return <Redirect to={{pathname: env.PREFIX + 'dashboard'}} />
  }
  return (<NotFound />)
}

class AppRouter extends Component {
  render () {
    return (
      <Router>
        <AdminLayout>
          <div>
            <Switch>
              {LandPage.asRouterItem()}
              {ResetPassword.asRouterItem()}
              {EmailResetLanding.asRouterItem()}
              {EmailInviteLanding.asRouterItem()}
              {EmailActivateLanding.asRouterItem()}
              {Dashboard.asRouterItem()}
              {Profile.asRouterItem()}

              {UsersImport.asRouterItem()}

              {OrganizationDetail.asRouterItem()}

              {DataSets.asRouterItem()}
              {ReadyDataSets.asRouterItem()}

              {Projects.asRouterItem()}

              {Calendar.asRouterItem()}

              {ProjectDetail.asRouterItem()}

              {SalesCenters.asRouterItem()}
              {SalesCenterDetail.asRouterItem()}
              {SalesCentersImport.asRouterItem()}

              {Products.asRouterItem()}
              {ProductDetail.asRouterItem()}

              {Channels.asRouterItem()}
              {ChannelsDetail.asRouterItem()}
              {ChannelImport.asRouterItem()}
              {ProductsImport.asRouterItem()}

              {Prices.asRouterItem()}
              {PriceDetail.asRouterItem()}
              {CatalogDetail.asRouterItem()}

              {HistoricalReport.asRouterItem()}
              {StatusReport.asRouterItem()}
              {DownloadReport.asRouterItem()}

              {OrgRules.asRouterItem()}
              {UsersGroups.asRouterItem()}
              {Roles.asRouterItem()}

              {Forecast.asRouterItem()}
              {ForecastDetail.asRouterItem()}
              {ForecastCompare.asRouterItem()}

              <CatalogRouter path={env.PREFIX + '/catalogs/'} />

              <Route component={NoMatch} />

            </Switch>
          </div>
        </AdminLayout>
      </Router>)
  }
}

export default AppRouter
