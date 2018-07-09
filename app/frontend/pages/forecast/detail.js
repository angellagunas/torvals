import React, { Component } from 'react'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Page from '~base/page'
import Breadcrumb from '~base/components/base-breadcrumb'
import DeleteButton from '~base/components/base-deleteButton'
import Loader from '~base/components/spinner'

class ForecastDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true
    }
  }
  render () {
    if (this.state.loading) {
      return <div className='column is-fullwidth has-text-centered subtitle has-text-primary'>
        Cargando, un momento por favor
          <Loader />
      </div>
    }
    return (
      <div>
        <div className='section-header'>
          <h2>Forecasts Detail</h2>
        </div>
        <div className='level'>
          <div className='level-left'>
            <div className='level-item'>
              <Breadcrumb
                path={[
                  {
                    path: '/',
                    label: 'Inicio',
                    current: false
                  },
                  {
                    path: '/manage/groups',
                    label: 'Grupos',
                    current: true
                  },
                  {
                    path: '/manage/groups',
                    label: 'Detalle',
                    current: true
                  },
                  {
                    path: '/manage/groups/',
                    label: group.name,
                    current: true
                  }
                ]}
                align='left'
              />
            </div>
          </div>
          <div className='level-right'>
            <div className='level-item'>
              <a
                className='button is-info'
                onClick={() => { this.props.selectGroup() }}>
                Regresar
              </a>
            </div>
            <div className='level-item'>
              <DeleteButton
                titleButton={'Eliminar'}
                objectName='Grupo'
                objectDelete={this.deleteObject.bind(this)}
                message={`¿Está seguro que desea eliminar el grupo ${group.name}?`}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/forecast/detail/:uuid',
  title: 'Forecast',
  icon: 'bar-chart',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  component: ForecastDetail
})
