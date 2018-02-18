import React, { Component } from 'react'
import api from '~base/api'
import { testRoles } from '~base/tools'

import Page from '~base/page'
import { loggedIn, verifyRole } from '~base/middlewares/'
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
      roles: 'admin, orgadmin, analyst, opsmanager',
      canEdit: false,
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
    this.setState({canEdit: testRoles(this.state.roles)})
  }

  async load () {
    var url = '/app/channels/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      channel: body.data
    })
  }

  async deleteObject () {
    var url = '/app/channels/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/channels')
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
    let { loaded, canEdit } = this.state
    if (!loaded) {
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
                    { canEdit &&
                      <DeleteButton titleButton={'Borrar'}
                        objectName='Canal'
                        objectDelete={this.deleteObject.bind(this)}
                        message={`Estas seguro de quieres borrar el canal ${channel.name}?`}
                      />
                    }
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
                          baseUrl='/app/channels'
                          url={'/app/channels/' + this.props.match.params.uuid}
                          initialState={channel}
                          load={this.load.bind(this)}
                          canEdit={canEdit}
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
  path: '/channels/:uuid',
  title: 'Channel Detail',
  exact: true,
  roles: 'analyst, orgadmin, admin, localmanager',
  validate: [loggedIn, verifyRole],
  component: ChannelDetail
})
