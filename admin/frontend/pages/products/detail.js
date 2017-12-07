import React, { Component } from 'react'
import api from '~base/api'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProductForm from './create-form'

class ProductDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      product: {}
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/admin/products/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      product: body.data
    })
  }

  async deleteOnClick () {
    var url = '/admin/products/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/products')
  }

  render () {
    const { product } = this.state.product

    if (!this.state.loaded) {
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
                      Product
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <ProductForm
                          baseUrl='/admin/products'
                          url={'/admin/products/' + this.props.match.params.uuid}
                          initialState={product}
                          load={this.load.bind(this)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Save</button>
                            </div>
                          </div>
                        </ProductForm>
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
  path: '/products/detail/:uuid',
  title: 'Product detail',
  exact: true,
  validate: loggedIn,
  component: ProductDetail
})
