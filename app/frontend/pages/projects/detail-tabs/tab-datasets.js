import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import CreateDataSet from '../create-dataset'
import api from '~base/api'
import PropTypes from 'baobab-react/prop-types'
import DeleteButton from '~base/components/base-deleteButton'
import moment from 'moment'
import {datasetStatus, testRoles} from '~base/tools'
import DataSetDetail from '../../datasets/dataset-detail'
import Loader from '~base/components/spinner'

class TabDatasets extends Component {
  constructor (props) {
    super(props)
    this.state = {
      datasetClassName: '',
      datasetDetail: this.props.datasetDetail
    }
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  getColumns () {
    return [
      {
        'title': this.formatTitle('tables.colName'),
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <a onClick={() => { this.setDatasetDetail(row) }}>
              {row.name}
            </a>
          )
        }
      },
      {
        'title': this.formatTitle('datasets.dateRange'),
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
        'title': this.formatTitle('datasets.source'),
        'property': 'source',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (this.formatTitle('dates.locale') === 'en') {
            return <span className='is-capitalized'>{row.source}</span>
          } else {
            return datasetStatus[row.source]
          }
        }
      },
      {
        'title': this.formatTitle('tables.colCreated'),
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
        'title': this.formatTitle('tables.colActions'),
        formatter: (row) => {
          return (
            <div className='field is-grouped'>
              <div className='control'>
                {
                  testRoles('manager-level-2, consultor-level-3')
                    ? <a onClick={() => { this.setDatasetDetail(row) }}
                      className={
                        row.status === 'conciliated' || row.status === 'adjustment' || row.status === 'ready'
                          ? 'button'
                          : 'is-hidden'
                      }
                    >
                      <span className='icon is-small' title='Visualizar'>
                        <i className='fa fa-eye' />
                      </span>
                    </a>
                    : <a onClick={() => { this.setDatasetDetail(row) }}
                      className={
                        row.status === 'conciliated' || row.status === 'adjustment' || row.status === 'ready'
                          ? 'button is-primary'
                          : 'is-hidden'
                      }

                    >
                      <span className='icon is-small' title='Editar'>
                        <i className='fa fa-pencil' />
                      </span>
                    </a>
                }

                <a onClick={() => { this.setDatasetDetail(row) }}
                  className={
                    row.status !== 'conciliated' && row.status !== 'adjustment' && row.status !== 'ready'
                    ? 'button is-info'
                    : 'is-hidden'
                  }
                >
                  <FormattedMessage
                    id='datasets.endConfig'
                    defaultMessage={`Fin. Configuración`}
                  />
                </a>
              </div>
              <div className='control'>
                { this.props.canEdit && !row.isMain &&
                  <DeleteButton
                    iconOnly
                    icon='fa fa-trash'
                    objectName='Dataset'
                    titleButton={this.formatTitle('datasets.delete')}
                    objectDelete={() => this.removeDatasetOnClick(row.uuid)}
                    message={this.formatTitle('datasets.deleteMsg') + row.name + '?'}
              />
            }
              </div>
            </div>
          )
        }
      }
    ]
  }

  async removeDatasetOnClick (uuid) {
    var url = `/app/projects/${this.props.project.uuid}/remove/dataset`
    await api.post(url, { dataset: uuid })
    await this.props.reload()
    await this.loadDatasetsList()
  }

  async loadDatasetsList () {
    var cursor = this.context.tree.select('datasets')

    var url = '/app/datasets/'
    const body = await api.get(url, {
      start: 0,
      limit: 10,
      sort: cursor.get('sort') || '',
      project: this.props.project.uuid
    })

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

    this.setDatasetDetail(object)
  }

  componentWillMount () {
    this.props.setAlert('is-white', ' ')
  }

  componentWillReceiveProps (next) {
    if (next.datasetDetail !== undefined &&
        this.state.datasetDetail !== next.datasetDetail &&
        next.datasetDetail !== ''
      ) {
      this.setState({
        datasetDetail: next.datasetDetail
      })
    }
  }
  async setDatasetDetail (dataset, tab) {
    await this.props.reload(tab)

    this.setState({
      datasetDetail: dataset
    })
  }

  render () {
    const dataSetsNumber = this.props.project.datasets.length
    let adviseContent = null
    if (dataSetsNumber) {
      adviseContent =
        <div>
          <FormattedMessage
            id='datasets.datasetConfigMsg1'
            defaultMessage={`Debes terminar de configurar al menos un dataset`}
          />
        </div>
    } else {
      adviseContent =
        <div>
          <FormattedMessage
            id='datasets.datasetConfigMsg2'
            defaultMessage={`Necesitas subir y configurar al menos un dataset para tener información disponible`}
          />
        </div>
    }
    if (this.props.project.status === 'updating-rules') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          <FormattedMessage
            id='datasets.updatingRules'
            defaultMessage={`Actualizando reglas del proyecto`}
          />
          <Loader />
        </div>
      )
    }
    return (
      <div className='dataset-tab'>
        {!this.state.datasetDetail
        ? <div className='card-content'>
          <div className='columns'>
            <div className='column'>
              {this.props.project.status === 'empty'
              ? <article className='message is-warning'>
                <div className='message-header'>
                  <p>
                    <FormattedMessage
                      id='datasets.alertMsg'
                      defaultMessage={`Atención`}
                    />
                  </p>
                </div>
                <div className='message-body is-size-6'>
                  <div className='level'>
                    <div className='level-left'>
                      <div className='level-item'>
                        <span className='icon is-large has-text-warning'>
                          <i className='fa fa-exclamation-triangle fa-2x' />
                        </span>
                      </div>
                      <div className='level-item'>
                        {adviseContent}
                      </div>
                    </div>
                    <div className='level-right'>
                      <div className='level-item'>
                        <a
                          className='button is-info is-pulled-right'
                          onClick={() => this.showModalDataset()}>
                          <span>
                            <FormattedMessage
                              id='datasets.add'
                              defaultMessage={`Agregar Dataset`}
                            />
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
              : this.props.canEdit &&
              <a
                className='button is-info is-pulled-right has-20-margin-sides'
                onClick={() => this.showModalDataset()}>
                <span>
                  <FormattedMessage
                    id='datasets.add'
                    defaultMessage={`Agregar Dataset`}
                  />
                </span>
              </a>
            }
            </div>
          </div>
          <div className='columns'>
            <div className='column'>
              <BranchedPaginatedTable
                branchName='datasets'
                baseUrl='/app/datasets/'
                columns={this.getColumns()}
                filters={{ project: this.props.project.uuid }}
              />
            </div>
          </div>
          <CreateDataSet
            branchName='datasets'
            url='/app/datasets'
            organization={this.props.project.organization.uuid}
            project={this.props.project.uuid}
            className={this.state.datasetClassName}
            hideModal={this.hideModalDataset.bind(this)}
            finishUp={this.finishUpDataset.bind(this)}
          />
        </div>

            : <DataSetDetail
              dataset={this.state.datasetDetail}
              setDataset={this.setDatasetDetail.bind(this)}
              history={this.props.history} />
          }
      </div>
    )
  }
}

TabDatasets.contextTypes = {
  tree: PropTypes.baobab
}

export default injectIntl(TabDatasets)
