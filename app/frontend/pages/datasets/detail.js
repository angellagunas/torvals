import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import FontAwesome from 'react-fontawesome'
import env from '~base/env-variables'

import DatasetDetailForm from './detail-form'
import { UploadDataset } from '~base/components/base-uploads'
import ConfigureDatasetForm from './configure-form'

class DataSetDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      dataset: {}
    }
  }

  componentWillMount () {
    this.context.tree.set('datasets', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    this.context.tree.commit()
    this.load()
  }

  async load () {
    var url = '/app/datasets/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      dataset: body.data
    })
  }

  getColumns () {
    return [
      {
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Email',
        'property': 'email',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          return <Link className='button' to={'/manage/users/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }

  changeHandler (data) {
    this.setState({
      dataset: data
    })
  }

  async deleteOnClick () {
    var url = '/app/datasets/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/datasets')
  }

  async configureOnClick () {
    var url = '/app/datasets/' + this.props.match.params.uuid + '/set/configure'
    await api.post(url)
    await this.load()
  }

  async readyOnClick () {
    var url = '/app/datasets/' + this.props.match.params.uuid + '/set/ready'
    await api.post(url)
    await this.load()
  }

  getUpload () {
    let dataset = this.state.dataset
    if (!dataset.fileChunk || (dataset.fileChunk && dataset.status === 'uploading')) {
      return (
        <div className='column'>
          <UploadDataset
            query={{dataset: dataset.uuid}}
            load={() => { this.load() }}
            url={env.API_HOST + '/api/app/upload/'}
          />
        </div>
      )
    }

    if (dataset.status === 'uploaded') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                File uploaded
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon is-large'>
                        <FontAwesome className='fa-3x fa-spin' name='cog' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      File {dataset.fileChunk.filename} has been uploaded
                      and will be sent for preprocessing. Please come back in
                      a couple of minutes.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'preprocessing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                File sent for preprocessing
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon has-text-success is-large'>
                        <FontAwesome className='fa-3x' name='check-square-o' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      File {dataset.fileChunk.filename} is being preprocessed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'processing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Processing file
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon has-text-success is-large'>
                        <FontAwesome className='fa-3x fa-spin' name='cog' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      Dataset is being processed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'configuring') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Configuring Dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>
                  <ConfigureDatasetForm
                    columns={dataset.columns || []}
                    url={'/app/datasets/' + dataset.uuid + '/configure'}
                    changeHandler={(data) => this.changeHandler(data)}
                    load={this.load.bind(this)}
                  >
                    <div className='field is-grouped'>
                      <div className='control'>
                        <button className='button is-primary'>Configure</button>
                      </div>
                    </div>
                  </ConfigureDatasetForm>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'reviewing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Review dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>
                  <div className='field is-grouped'>
                    <div className='control'>
                      <button
                        className='button is-black'
                        onClick={e => this.configureOnClick()}
                      >
                        Configure
                      </button>
                    </div>
                    <div className='control'>
                      <button
                        className='button is-primary'
                        onClick={e => this.readyOnClick()}
                      >
                        Ready
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'ready') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Dataset ready
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon has-text-success is-large'>
                        <FontAwesome className='fa-3x' name='thumbs-up' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      Dataset ready
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  render () {
    const { dataset } = this.state

    if (!dataset.uuid) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <button
                      className='button is-danger'
                      type='button'
                      onClick={() => this.deleteOnClick()}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Dataset
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <DatasetDetailForm
                          baseUrl='/app/datasets'
                          url={'/app/datasets/' + this.props.match.params.uuid}
                          initialState={{
                            name: this.state.dataset.name,
                            description: this.state.dataset.description,
                            organization: this.state.dataset.organization.uuid,
                            status: dataset.status
                          }}
                          load={this.load.bind(this)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Save</button>
                            </div>
                          </div>
                        </DatasetDetailForm>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {this.getUpload()}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

DataSetDetail.contextTypes = {
  tree: PropTypes.baobab
}

export default branch({datasets: 'datasets'}, DataSetDetail)
