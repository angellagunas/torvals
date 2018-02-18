import React, { Component } from 'react'
import api from '~base/api'

import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ChannelForm from './create-form'
import DeleteButton from '~base/components/base-deleteButton'

class ChannelDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      channel: {},
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/admin/channels/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      channel: body.data
    })
  }

  async deleteObject () {
    var url = '/admin/channels/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/channels')
  }

  getColumns () {
    return [
      {
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      }
    ]
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finishUpHandler () {
    this.setState({ isLoading: '' })
  }

  render () {
    if (!this.state.loaded) {
      return <Loader />
    }

    let channel = {
      name: this.state.channel.name,
      organization: this.state.channel.organization.uuid,
      externalId: this.state.channel.externalId
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <DeleteButton titleButton={'Borrar'}
                      objectName='Producto'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`Estas seguro de quieres borrar el canal ${channel.name}?`}
                      />
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Canal
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <ChannelForm
                          baseUrl='/admin/channels'
                          url={'/admin/channels/' + this.props.match.params.uuid}
                          initialState={channel}
                          load={this.load.bind(this)}
                          submitHandler={(data) => this.submitHandler(data)}
                          errorHandler={(data) => this.errorHandler(data)}
                          finishUp={(data) => this.finishUpHandler(data)}
                          >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button
                                className={'button is-primary ' + this.state.isLoading}
                                disabled={!!this.state.isLoading}
                                type='submit'
                              >Guardar</button>
                            </div>
                          </div>
                        </ChannelForm>
                      </div>
                    </div>
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

export default Page({
  path: '/channels/detail/:uuid',
  title: 'Channel Detail',
  exact: true,
  validate: loggedIn,
  component: ChannelDetail
})
