import React, { Component } from 'react'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import Link from '~base/router/link'
import CreateDataSet from '../create-dataset'
import api from '~base/api'
import PropTypes from 'baobab-react/prop-types'
import DeleteButton from '~base/components/base-deleteButton'
import moment from 'moment'
import AddExternalDataset from '../add-external'

class TabDatasets extends Component {
  constructor (props) {
    super(props)
    this.state = {
      datasetClassName: ''
    }
  }
  getColumns () {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/datasets/detail/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Rango Fechas',
        'property': 'dateMin',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.dateMin) {
            return (row.dateMin + ' - ' + row.dateMax)
          }
        }
      },
      {
        'title': 'Fuente',
        'property': 'source',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Añadido en',
        'property': 'dateCreated',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
           moment.utc(row.dateCreated).format('DD/MM/YYYY')
          )
        }
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          return (
            <div className='field is-grouped'>
              <div className='control'>
                <Link
                  className={row.status === 'conciliated' ? 'button' : 'is-hidden'}
                  to={'/datasets/detail/' + row.uuid}
                >
                  Detalle
                </Link>
                <Link
                  className={row.status !== 'conciliated' ? 'button is-primary' : 'is-hidden'}
                  to={'/datasets/detail/' + row.uuid}
                >
                  Fin. Configuración
                </Link>
              </div>
              <div className='control'>
                <DeleteButton
                  objectName='Dataset'
                  objectDelete={() => this.removeDatasetOnClick(row.uuid)}
                  message={'Estas seguro de querer eliminar este dataset?'}
                />
              </div>
            </div>
          )
        }
      }
    ]
  }

  async removeDatasetOnClick (uuid) {
    var url = `/admin/projects/${this.props.project.uuid}/remove/dataset`
    await api.post(url, { dataset: uuid })
    await this.loadDatasetsList()
  }

  async loadDatasetsList () {
    var url = '/admin/datasets/'
    const body = await api.get(url, {
      start: 0,
      limit: 10,
      project: this.props.project.uuid
    })

    var cursor = this.context.tree.select('datasets')

    cursor.set({
      page: 1,
      totalItems: body.total,
      items: body.data,
      pageLength: 10
    })
    this.context.tree.commit()
  }

  showModalDataset () {
    this.setState({
      datasetClassName: ' is-active'
    })
  }

  hideModalDataset (e) {
    this.setState({
      datasetClassName: ''
    })
  }

  finishUpDataset (object) {
    this.setState({
      datasetClassName: ''
    })
    this.props.history.push('/admin/datasets/detail/' + object.uuid)
  }

  render () {
    return (
      <div className='card2'>
        <header className='card-header'>
          <p className='card-header-title'>
            Datasets
          </p>
          <div className='card-header-select'>
            <div className='field is-grouped'>
              <div className='control'>
                <AddExternalDataset
                  project={this.props.project}
                  load={async () => { await this.loadDatasetsList() }}
                />
              </div>
            </div>
          </div>

        </header>
        <div className='card-content'>
          <div className={this.props.project.status === 'empty' ? 'columns no-hidden' : 'is-hidden'}>
            <div className='column'>
              <article className='message is-warning'>
                <div className='message-header'>
                  <p>Atención</p>
                </div>
                <div className='message-body has-text-centered is-size-5'>
                  Necesitas subir y configurar al menos un
                  <strong> dataset </strong> para tener información disponible
                <br />
                  <br />
                  <a
                    className='button is-large is-primary'
                    onClick={() => this.showModalDataset()}
                  >
                    <span className='icon is-medium'>
                      <i className='fa fa-plus-circle' />
                    </span>
                    <span>Agregar Dataset</span>
                  </a>
                </div>
              </article>
            </div>
          </div>
          <div className='columns'>
            <div className='column'>
              <BranchedPaginatedTable
                branchName='datasets'
                baseUrl='/admin/datasets/'
                columns={this.getColumns()}
                filters={{ project: this.props.project.uuid }}
              />
            </div>
          </div>
          <CreateDataSet
            branchName='datasets'
            url='/admin/datasets'
            organization={this.props.project.organization.uuid}
            project={this.props.project.uuid}
            className={this.state.datasetClassName}
            hideModal={this.hideModalDataset.bind(this)}
            finishUp={this.finishUpDataset.bind(this)}
          />
        </div>
      </div>
    )
  }
}

TabDatasets.contextTypes = {
  tree: PropTypes.baobab
}

export default TabDatasets
