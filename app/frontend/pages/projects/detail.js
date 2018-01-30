import React, { Component } from 'react'
import api from '~base/api'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'

import DeleteButton from '~base/components/base-deleteButton'
import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import Tabs from '~base/components/base-tabs'
import TabDatasets from './detail-tabs/tab-datasets'
import {Line} from 'react-chartjs-2'

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {},
      selectedTab: 'General'
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/app/projects/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      project: body.data
    })
  }

  async deleteObject () {
    var url = '/app/projects/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/projects')
  }

  render () {
    const { project } = this.state

    const data = {
      labels: ['01/11/2017', '01/12/2017', '01/01/2018', '01/02/2018', '01/02/2018', '01/03/2018', '01/04/2018'],
      datasets: [
        {
          label: 'Predicción',
          fill: false,
          lineTension: 0.1,
          backgroundColor: '#01579B',
          borderColor: '#01579B',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: [200000, 255888, 254888, 205888, 200000, 400000, 350000]
        },
        {
          label: 'Ajuste',
          fill: false,
          lineTension: 0.1,
          backgroundColor: '#FF9800',
          borderColor: '#FF9800',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: [150480, 200000, 404888, 165888, 190000, 480000, 120000]

        },
        {
          label: 'Venta registrada',
          fill: false,
          lineTension: 0.1,
          backgroundColor: '#8BC34A',
          borderColor: '#8BC34A',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: [160480, 160000, 254888, 205888, 190000, 300000, 280000]
        }

      ]
    }
    var historical = (<div className='card'>
      <div className='card-content'>
        <div className='columns'>
          <div className='column is-half' />
          <div className='column'>
            <div className='card'>
              <div className='card-header'>
                <h1 className='card-header-title'>Totales de Venta</h1>
              </div>
              <div className='card-content historical-container'>
                <table className='table historical'>
                  <thead>
                    <tr>
                      <th colSpan='2'>Predicción</th>
                      <th colSpan='2'>Ajuste</th>
                      <th colSpan='2'>Venta Registrada</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='font-blue'>
                        Semana 19
                      </td>
                      <td className='font-blue'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-orange'>
                        Semana 19
                      </td>
                      <td className='font-orange'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-green'>
                        Semana 19
                      </td>
                      <td className='font-green'>
                        $ 2,684,262.60
                      </td>
                    </tr>
                    <tr>
                      <td className='font-blue'>
                        Semana 19
                      </td>
                      <td className='font-blue'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-orange'>
                        Semana 19
                      </td>
                      <td className='font-orange'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-green'>
                        Semana 19
                      </td>
                      <td className='font-green'>
                        $ 2,684,262.60
                      </td>
                    </tr>
                    <tr>
                      <td className='font-blue'>
                        Semana 19
                      </td>
                      <td className='font-blue'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-orange'>
                        Semana 19
                      </td>
                      <td className='font-orange'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-green'>
                        Semana 19
                      </td>
                      <td className='font-green'>
                        $ 2,684,262.60
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Line data={data} width={200} height={50} />
    </div>)

    if (!this.state.loaded) {
      return <Loader />
    }
    const tabs = [
      {
        name: 'General',
        title: 'Información',
        icon: 'fa-tasks',
        content: (
          <div className='card'>
            <header className='card-header'><p className='card-header-title'> Información </p></header>
            <div className='card-content'>
              <ProjectForm
                baseUrl='/app/projects'
                url={'/app/projects/' + this.props.match.params.uuid}
                initialState={{ ...project, organization: project.organization.uuid }}
                load={this.load.bind(this)}
              >
                <div className='field is-grouped'>
                  <div className='control'>
                    <button className='button is-primary'>Guardar</button>
                  </div>
                </div>
              </ProjectForm>
            </div>
          </div>
        )
      },
      {
        name: 'Datasets',
        title: 'Datasets',
        icon: 'fa-signal',
        content: (
          <TabDatasets
            project={project}
            history={this.props.history}
          />
        )
      },
      {
        name: 'Ajustes',
        title: 'Ajustes',
        icon: 'fa-cogs',
        content: <div className='card'>Ajustes</div>
      },
      {
        name: 'Historico',
        title: 'Historico',
        icon: 'fa-history',
        content: historical
      }

    ]

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top'>
            <div className='columns is-padding-top-small is-padding-bottom-small'>
              <div className='column'>
                <h1 className='is-size-3'>{project.name}</h1>
              </div>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <DeleteButton
                      objectName='Proyecto'
                      objectDelete={this.deleteObject.bind(this)}
                      message={'Estas seguro de querer eliminar este Proyecto?'}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Tabs
              tabs={tabs}
              selectedTab={this.state.selectedTab}
            />

          </div>
        </div>
      </div>
    )
  }
}

ProjectDetail.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedProjectDetail = branch((props, context) => {
  return {
    data: 'datasets'
  }
}, ProjectDetail)

export default Page({
  path: '/projects/:uuid',
  title: 'Detalle de Proyecto',
  exact: true,
  roles: 'enterprisemanager, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  component: BranchedProjectDetail
})
