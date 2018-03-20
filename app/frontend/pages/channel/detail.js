import React, { Component } from 'react'
import api from '~base/api'
import { testRoles } from '~base/tools'

import Page from '~base/page'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ChannelForm from './create-form'
import DeleteButton from '~base/components/base-deleteButton'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'

class ChannelDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      channel: {},
      roles: 'admin, orgadmin, analyst, manager-level-2',
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
    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        channel: body.data
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async deleteObject () {
    var url = '/app/channels/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/catalogs/channels')
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
    if (this.state.notFound) {
      return <NotFound msg='este canal' />
    }

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
          <div className='section is-paddingless-top pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/',
                  label: 'Inicio',
                  current: false
                },
                {
                  path: '/catalogs/channels',
                  label: 'Canales',
                  current: false
                },
                {
                  path: '/catalogs/channels/',
                  label: 'Detalle',
                  current: true
                },
                {
                  path: '/catalogs/channels/',
                  label: channel.name,
                  current: true
                }
              ]}
              align='left'
            />
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
  path: '/catalogs/channels/:uuid',
  title: 'Channel Detail',
  exact: true,
  roles: 'analyst, orgadmin, admin, manager-level-1, manager-level-2, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: ChannelDetail
})
