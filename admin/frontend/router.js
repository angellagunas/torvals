import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom'
import { IntlProvider, addLocaleData } from 'react-intl'

import AdminLayout from '~components/admin-layout'

import LandPage from './pages/land-page'
import Dashboard from './pages/dashboard'
import ResetPassword from './pages/reset-password'
import EmailResetLanding from './pages/emails/reset'
import Users from './pages/users/list'
import UserDetail from './pages/users/detail'
import DeletedUsers from './pages/users/list-deleted'
import Profile from './pages/profile'
import Organizations from './pages/organizations/list'
import OrganizationDetail from './pages/organizations/detail'
import Roles from './pages/roles/list'
import RoleDetail from './pages/roles/detail'
import Groups from './pages/groups/list'
import GroupDetail from './pages/groups/detail'
import DataSets from './pages/datasets/list'
import DeletedDataSets from './pages/datasets/list-deleted'
import ReadyDataSets from './pages/datasets/list-ready'
import DataSetDetail from './pages/datasets/detail'
import SalesCenters from './pages/salesCenters/list'
import SalesCenterDetail from './pages/salesCenters/detail'
import DeletedSalesCenters from './pages/salesCenters/deleted-list'
import RequestLogs from './pages/request-logs/list'
import Products from './pages/products/list'
import ProductDetail from './pages/products/detail'
import DeletedProducts from './pages/products/deleted-list'
import Forecasts from './pages/forecasts/list'
import ForecastDetail from './pages/forecasts/detail'
import PredictionHistoric from './pages/prediction-historic/list'
import env from '~base/env-variables'
import Projects from './pages/projects/list'
import ProjectDetail from './pages/projects/detail'
import DeletedProjects from './pages/projects/deleted-list'
import Channels from './pages/channels/list'
import DeletedChannels from './pages/channels/deleted-list'
import ChannelDetail from './pages/channels/detail'
import NotFound from '~base/components/not-found'
import Calendar from './pages/calendar'
import Prices from './pages/prices/list'
import PriceDetail from './pages/prices/detail'
import Engines from './pages/engines/list'
import EngineDetail from './pages/engines/detail'
import UsersImport from './pages/import/users'
import ChannelImport from './pages/import/channels'
import ProductsImport from './pages/import/products'
import SalesCentersImport from './pages/import/sales-centers'

import en from 'react-intl/locale-data/en'
import es from 'react-intl/locale-data/es'

addLocaleData([...en, ...es])

const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage

const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0]

const NoMatch = () => {
  if (window.location.pathname.replace(/\//g, '') === 'admin') {
    return <Redirect to={{pathname: env.PREFIX + '/dashboard'}} />
  }
  return <NotFound />
}

const AppRouter = () => {
  return (
    <Router>
      <IntlProvider locale={language || 'es'}>
        <AdminLayout>
          <div className='c-flex-1 is-flex is-flex-column is-relative'>
            <Switch>
              {LandPage.asRouterItem()}
              {ResetPassword.asRouterItem()}
              {EmailResetLanding.asRouterItem()}
              {Dashboard.asRouterItem()}
              {Profile.asRouterItem()}

              {Users.asRouterItem()}
              {DeletedUsers.asRouterItem()}
              {UserDetail.asRouterItem()}
              {UsersImport.asRouterItem()}

              {Organizations.asRouterItem()}
              {OrganizationDetail.asRouterItem()}

              {Roles.asRouterItem()}
              {RoleDetail.asRouterItem()}

              {Groups.asRouterItem()}
              {GroupDetail.asRouterItem()}

              {DataSets.asRouterItem()}
              {DeletedDataSets.asRouterItem()}
              {ReadyDataSets.asRouterItem()}
              {DataSetDetail.asRouterItem()}

              {Projects.asRouterItem()}
              {DeletedProjects.asRouterItem()}
              {ProjectDetail.asRouterItem()}

              {Calendar.asRouterItem()}

              {Engines.asRouterItem()}
              {EngineDetail.asRouterItem()}

              {SalesCenters.asRouterItem()}
              {DeletedSalesCenters.asRouterItem()}
              {SalesCenterDetail.asRouterItem()}
              {SalesCentersImport.asRouterItem()}

              {Products.asRouterItem()}
              {DeletedProducts.asRouterItem()}
              {ProductDetail.asRouterItem()}

              {Forecasts.asRouterItem()}
              {ForecastDetail.asRouterItem()}

              {RequestLogs.asRouterItem()}
              {PredictionHistoric.asRouterItem()}
              {Channels.asRouterItem()}
              {DeletedChannels.asRouterItem()}
              {ChannelDetail.asRouterItem()}
              {ChannelImport.asRouterItem()}
              {ProductsImport.asRouterItem()}

              {Prices.asRouterItem()}
              {PriceDetail.asRouterItem()}

              <Route component={NoMatch} />

              <div id='route' />
            </Switch>
          </div>
        </AdminLayout>
      </IntlProvider>
    </Router>
  )
}

export default AppRouter
