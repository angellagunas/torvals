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
      price: {}
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/admin/prices/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      price: body.data
    })
  }

  async deleteOnClick () {
    var url = '/admin/prices/' + this.props.match.params.uuid
    const body = await api.del(url)
    this.props.history.push('/admin/prices')
  }

  render () {
    const {price} = this.state
    if (!this.state.loaded) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section  is-paddingless-top pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/admin',
                  label: 'Dashboard',
                  current: false
                },
                {
                  path: '/admin/prices',
                  label: 'Precios',
                  current: false
                },
                {
                  path: '/admin/prices/detail/',
                  label: 'Detalle de precio',
                  current: true
                }
              ]}
              align='left'
            />
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <button
                      className='button is-danger'
                      type='button'
                      onClick={() => this.deleteOnClick()}
                        >
                          Eliminar
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
                      Precio
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <PriceForm
                          baseUrl='/admin/prices'
                          url={'/admin/prices/' + this.props.match.params.uuid}
                          initialState={{price: String(price.price), product: price.product.name, channel: price.channel.name}}
                          load={this.load.bind(this)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Guardar</button>
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

const branchedPriceDetails = branch({ prices: 'prices'}, PriceDetail)

export default Page({
  path: '/prices/:uuid',
  title: 'Price details',
  exact: true,
  validate: loggedIn,
  component: branchedPriceDetails
})
