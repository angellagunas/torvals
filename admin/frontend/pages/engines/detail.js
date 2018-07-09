import React, { Component } from 'react'
import Link from '~base/router/link'
import api from '~base/api'

import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import Loader from '~base/components/spinner'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'
import EngineForm from './form'

class EngineDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      isLoading: '',
      engine: {}
    }
  }

  componentDidMount() {
    this.load()
  }

  load = async () => {
    const url = '/admin/engines/' + this.props.match.params.uuid
    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        engine: body || {}
      })
    } catch (e) {
      this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  submitHandler = () => {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler = () => {
    this.setState({ isLoading: '' })
  }

  finishUpHandler = () => {
    this.setState({ isLoading: '' })
  }

  render () {
    const { engine, notFound, isLoading } = this.state

    if (notFound) {
      return <NotFound msg='este modelo' />
    }

    if (!engine.uuid) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/admin',
                  label: 'Inicio',
                  current: false
                },
                {
                  path: '/admin/engines',
                  label: 'Modelos',
                  current: false
                },
                {
                  path: '/admin/engines/detail',
                  label: engine.name,
                  current: true
                }
              ]}
              align='left'
            />
            <br />
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Modelo
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <EngineForm
                          baseUrl='/admin/engine'
                          url={'/admin/engines/' + this.props.match.params.uuid}
                          initialState={engine}
                          load={this.load}
                          submitHandler={this.submitHandler}
                          errorHandler={this.errorHandler}
                          finishUp={this.finishUpHandler}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button
                                className={'button is-primary ' + isLoading}
                                disabled={!!isLoading}
                                type='submit'
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        </EngineForm>
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
  path: '/engines/detail/:uuid',
  title: 'Detalle',
  exact: true,
  validate: loggedIn,
  component: EngineDetail
})
