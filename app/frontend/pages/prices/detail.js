import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import PriceForm from './create-form'
import Breadcrumb from '~base/components/base-breadcrumb'

class PriceDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      price: {},
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/app/prices/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      price: body.data
    })
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
    const {price} = this.state
    if (!this.state.loaded) {
      return <Loader />
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
                  path: '/prices',
                  label: 'Precios',
                  current: false
                },
                {
                  path: '/prices/detail/',
                  label: 'Detalle',
                  current: true
                },
                {
                  path: '/prices/detail/',
                  label: price.product.name,
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
                      Precio
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <PriceForm
                          baseUrl='/app/prices'
                          url={'/app/prices/' + this.props.match.params.uuid}
                          initialState={{price: String(price.price), product: price.product.name, channel: price.channel.name}}
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
                        </PriceForm>
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

PriceDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedPriceDetails = branch({ prices: 'prices' }, PriceDetail)

export default Page({
  path: '/prices/:uuid',
  title: 'Price details',
  exact: true,
  validate: loggedIn,
  component: branchedPriceDetails
})
