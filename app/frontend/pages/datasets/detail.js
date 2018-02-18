import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import FontAwesome from 'react-fontawesome'
import env from '~base/env-variables'
import classNames from 'classnames'
import { testRoles } from '~base/tools'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import DatasetDetailForm from './detail-form'
import { UploadDataset } from '~base/components/base-uploads'
import ConfigureDatasetForm from './configure-form'
import DeleteButton from '~base/components/base-deleteButton'
import ConfigureViewDataset from './configure-view'
import BaseModal from '~base/components/base-modal'
import ProductForm from './edit-product'
import SalesCenterForm from './edit-salescenter'
import ChannelForm from './edit-channel'

class DataSetDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      classNameSC: '',
      classNameCh: '',
      isProductsOpen: false,
      isChannelsOpen: false,
      isSalesCenterOpen: false,
      loading: true,
      loaded: false,
      dataset: {},
      currentProduct: null,
      currentSalesCenter: null,
      columns: [],
      roles: 'admin, orgadmin, analyst',
      canEdit: false,
      isLoading: '',
      isLoadingConsolidate: '',
      isLoadingConfigure: ''
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
    this.interval = setInterval(() => this.load(), 30000)
    this.setState({canEdit: testRoles(this.state.roles)})
  }

  componentWillUnmount () {
    clearInterval(this.interval)
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
        'title': 'Nombre',
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
        'title': 'Acciones',
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

  async deleteObject () {
    if (!this.state.canEdit) return
    var url = '/app/datasets/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/datasets')
  }

  async configureOnClick () {
    if (!this.state.canEdit) return

    this.setState({ isLoadingConfigure: ' is-loading' })
    var url = '/app/datasets/' + this.props.match.params.uuid + '/set/configure'
    await api.post(url)
    await this.load()
    this.setState({ isLoadingConfigure: '' })
  }

  async consolidateOnClick () {
    if (!this.state.canEdit) return

    this.setState({ isLoadingConsolidate: ' is-loading' })
    var url = '/app/datasets/' + this.props.match.params.uuid + '/set/conciliate'
    await api.post(url)
    await this.load()
    this.setState({ isLoadingConsolidate: '' })
    this.props.history.push(`/projects/${this.state.dataset.project.uuid}`)
  }

  async cancelOnClick () {
    await this.configureOnClick()
  }

  getUpload () {
    let { dataset, canEdit } = this.state
    if (
      (!dataset.fileChunk && dataset.source === 'uploaded') ||
      (dataset.fileChunk && dataset.status === 'uploading')
    ) {
      if (canEdit) {
        return (
          <div className='column'>
            <UploadDataset
              query={{dataset: dataset.uuid}}
              load={() => { this.load() }}
              url={env.API_HOST + '/api/app/upload/'}
            />
          </div>
        )
      } else {
        return (
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  En espera de archivo
                </p>
              </header>
              <div className='card-content'>
                <div className='message is-info'>
                  <div className='message-body is-large has-text-centered'>
                    <div className='columns'>
                      <div className='column'>
                        Aún no se a cargado un archivo!.
                        Favor de acudir con su supervisor para cualquier aclaración.
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

    if (dataset.status === 'uploaded') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Archivo cargado
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
                      El archivo {dataset.fileChunk.filename} ha sido cargado a
                      nuestros servidores y se enviará para preprocesamiento.
                      Favor de regresar en un par de minutos.
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
                Archivo enviado a preprocesamiento
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
                      El archivo {dataset.fileChunk.filename} se está preprocesando
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
                Procesando archivo
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
                      El Dataset se está procesando
                    </div>
                  </div>
                </div>
              </div>
              <div className='columns'>
                <div className='column'>
                  <div className='field is-grouped'>
                    <div className='control'>
                      { canEdit &&
                        <button
                          className={'button is-black' + this.state.isLoadingConfigure}
                          disabled={!!this.state.isLoadingConfigure}
                          onClick={e => this.cancelOnClick()}
                        >
                          Cancelar
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'configuring') {
      if (canEdit) {
        return (
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Configurando el Dataset
                </p>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <ConfigureDatasetForm
                      initialState={dataset}
                      columns={dataset.columns}
                      url={'/app/datasets/' + dataset.uuid + '/configure'}
                      changeHandler={(data) => this.changeHandler(data)}
                      load={this.load.bind(this)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Configurando el Dataset
                </p>
              </header>
              <div className='card-content'>
                <div className='message is-info'>
                  <div className='message-body is-large has-text-centered'>
                    <div className='columns'>
                      <div className='column'>
                        Configuración en proceso!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    } else if (dataset.status === 'reviewing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Revisando el dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>
                  <div className='field is-grouped'>
                    <b>Fecha mínima:</b> <span style={{paddingLeft: '5px'}}>{dataset.dateMin}</span>
                  </div>
                  <div className='field is-grouped'>
                    <b>Fecha máxima:</b> <span style={{paddingLeft: '5px'}}>{dataset.dateMax}</span>
                  </div>
                  <ConfigureViewDataset
                    initialState={dataset}
                  />
                  { canEdit &&
                    <div className='field is-grouped'>
                      <div className='control'>
                        <button
                          className={'button is-black' + this.state.isLoadingConfigure}
                          disabled={!!this.state.isLoadingConfigure}
                          onClick={e => this.configureOnClick()}
                        >
                          Configurar
                        </button>
                      </div>
                      <div className='control'>
                        <button
                          className={'button is-primary' + this.state.isLoadingConsolidate}
                          disabled={!!this.state.isLoadingConsolidate}
                          onClick={e => this.consolidateOnClick()}
                        >
                          Conciliar
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'conciliated') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Dataset conciliado
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
                      Dataset conciliado
                    </div>
                  </div>
                </div>
              </div>
              <div className='field is-grouped'>
                <b>Fecha mínima:</b> <span style={{paddingLeft: '5px'}}>{dataset.dateMin}</span>
              </div>
              <div className='field is-grouped'>
                <b>Fecha máxima:</b> <span style={{paddingLeft: '5px'}}>{dataset.dateMax}</span>
              </div>
              <ConfigureViewDataset
                initialState={dataset}
              />
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'pendingRows') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Dataset enviado a procesamiento
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
                      Este Dataset se está procesando para ajuste, en unos momentos más aparecerá su información
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'adjustment') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Procesando ajustes del Dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon has-text-success is-large'>
                        <FontAwesome className='fa-3x' name='pencil' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      Se está haciendo ajuste de este Dataset
                    </div>
                  </div>
                </div>
              </div>
              <ConfigureViewDataset
                initialState={dataset}
              />
            </div>
          </div>
        </div>
      )
    }
  }

  /*
   * Unidentified products/sales center methods
   */
  setHeights (elements) {
    const scrollBody = elements || document.querySelectorAll('[data-content]')

    scrollBody.forEach((sticky) => {
      let bottom = sticky.getBoundingClientRect().bottom
      const footerHeight = 0
      const viewporHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      this.setState({bodyHeight: viewporHeight - (bottom + footerHeight)})
    })
  }

  toggleHeader () {
    this.setState({isHeaderOpen: !this.state.isHeaderOpen}, function () {
      this.setHeights()
    })
  }

  toggleUnidentifiedProducts () {
    this.setState({isProductsOpen: !this.state.isProductsOpen}, function () {
      this.setHeights()
    })
  }

  toggleUnidentifiedSalesCenters () {
    this.setState({isSalesCenterOpen: !this.state.isSalesCenterOpen}, function () {
      this.setHeights()
    })
  }

  toggleUnidentifiedChannels () {
    this.setState({isChannelsOpen: !this.state.isChannelsOpen}, function () {
      this.setHeights()
    })
  }

  getHeight (element) {
    if (this.state.bodyHeight === 0) {
      if (element) this.setHeights([element])
    }
  }

  showModal (item) {
    this.setState({
      className: ' is-active',
      currentProduct: item
    })
  }

  hideModal () {
    this.setState({
      className: '',
      currentProduct: null
    })
  }

  showModalSalesCenters (item) {
    this.setState({
      classNameSC: ' is-active',
      currentSalesCenter: item
    })
  }

  hideModalSalesCenters () {
    this.setState({
      classNameSC: '',
      currentSalesCenter: null
    })
  }

  showModalChannels (item) {
    this.setState({
      classNameCh: ' is-active',
      currentChannel: item
    })
  }

  hideModalChannels () {
    this.setState({
      classNameCh: '',
      currentChannel: null
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

  getModalCurrentProduct () {
    if (this.state.currentProduct && this.state.canEdit) {
      return (<BaseModal
        title='Edit Product'
        className={this.state.className}
        hideModal={() => this.hideModal()}
        >
        <ProductForm
          baseUrl='/app/products'
          url={'/app/products/' + this.state.currentProduct.uuid}
          initialState={this.state.currentProduct}
          load={this.deleteNewProduct.bind(this)}
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
            <div className='control'>
              <button className='button' onClick={() => this.hideModal()} type='button'>Cancel</button>
            </div>
          </div>
        </ProductForm>
      </BaseModal>)
    }
  }

  getModalChannels () {
    if (this.state.currentChannel && this.state.canEdit) {
      return (<BaseModal
        title='Editar Canal'
        className={this.state.classNameCh}
        hideModal={() => this.hideModalChannels()} >
        <ChannelForm
          baseUrl='/app/channels'
          url={'/app/channels/' + this.state.currentChannel.uuid}
          initialState={this.state.currentChannel}
          load={this.deleteNewChannel.bind(this)}
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
            <div className='control'>
              <button className='button' onClick={() => this.hideModalChannels()} type='button'>Cancel</button>
            </div>
          </div>
        </ChannelForm>
      </BaseModal>)
    }
  }

  getModalSalesCenters () {
    if (this.state.currentSalesCenter && this.state.canEdit) {
      return (<BaseModal
        title='Edit Sales Center'
        className={this.state.classNameSC}
        hideModal={() => this.hideModalSalesCenters()}
      >
        <SalesCenterForm
          baseUrl='/app/salesCenters'
          url={'/app/salesCenters/' + this.state.currentSalesCenter.uuid}
          initialState={this.state.currentSalesCenter}
          load={this.deleteNewSalesCenter.bind(this)}
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
            <div className='control'>
              <button className='button' onClick={() => this.hideModalSalesCenters()} type='button'>Cancel</button>
            </div>
          </div>
        </SalesCenterForm>
      </BaseModal>)
    }
  }

  async deleteNewProduct () {
    this.load()
    setTimeout(() => {
      this.hideModal()
    }, 1000)
  }

  async deleteNewSalesCenter () {
    this.load()
    setTimeout(() => {
      this.hideModalSalesCenters()
    }, 1000)
  }
  async deleteNewChannel () {
    this.load()
    setTimeout(() => {
      this.hideModalChannels()
    }, 1000)
  }

  getUnidentifiedChannels () {
    const { dataset, canEdit } = this.state
    if (!dataset.uuid) {
      return <Loader />
    }

    const headerChannelsClass = classNames('card-content', {
      'is-hidden': this.state.isChannelsOpen === false
    })

    const toggleBtnIconClass = classNames('fa', {
      'fa-angle-down': this.state.isChannelsOpen === false,
      'fa-angle-up': this.state.isChannelsOpen !== false
    })

    var newChannels = []
    dataset.newChannels.map((item, key) => {
      if (item.isNewExternal) {
        newChannels.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      newChannels.length === 0) {
      return ''
    }

    return (<div className='columns'>
      <div className='column'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
                Canales no identificados: {newChannels.length}
            </p>
            <div className='field is-grouped is-grouped-right card-header-select'>
              <div className='control'>
                <a
                  className='button is-inverted'
                  onClick={() => this.toggleUnidentifiedChannels()}>
                  <span className='icon is-small'>
                    <i className={toggleBtnIconClass} />
                  </span>
                </a>
              </div>
            </div>
          </header>
          <div className={headerChannelsClass}>
            <div className='columns'>
              <div className='column'>
                <table className='table is-fullwidth'>
                  <thead>
                    <tr>
                      <th colSpan='2'>Id Externo</th>
                      <th colSpan='2'>Nombre</th>
                      { canEdit &&
                        <th colSpan='2'>Acciones</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {
                      newChannels.map((item, key) => {
                        return (
                          <tr key={key}>
                            <td colSpan='2'>{item.externalId}</td>
                            <td colSpan='2'>{item.name}</td>
                            { canEdit &&
                              <td colSpan='2'>
                                <button
                                  className='button is-primary'
                                  onClick={() => this.showModalChannels(item)}
                                >
                                  Editar
                                </button>
                              </td>
                            }
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>)
  }

  getUnidentifiedSalesCenters () {
    const { dataset, canEdit } = this.state
    if (!dataset.uuid) {
      return <Loader />
    }

    const headerSalesCenterClass = classNames('card-content', {
      'is-hidden': this.state.isSalesCenterOpen === false
    })

    const toggleBtnIconClass = classNames('fa', {
      'fa-angle-down': this.state.isSalesCenterOpen === false,
      'fa-angle-up': this.state.isSalesCenterOpen !== false
    })

    var newSalesCenters = []
    dataset.newSalesCenters.map((item, key) => {
      if (item.isNewExternal) {
        newSalesCenters.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      newSalesCenters.length === 0) {
      return ''
    }

    return (<div className='columns'>
      <div className='column'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
                Centros de Venta no identificados: {newSalesCenters.length}
            </p>
            <div className='field is-grouped is-grouped-right card-header-select'>
              <div className='control'>
                <a
                  className='button is-inverted'
                  onClick={() => this.toggleUnidentifiedSalesCenters()}>
                  <span className='icon is-small'>
                    <i className={toggleBtnIconClass} />
                  </span>
                </a>
              </div>
            </div>
          </header>
          <div className={headerSalesCenterClass}>
            <div className='columns'>
              <div className='column'>
                <table className='table is-fullwidth'>
                  <thead>
                    <tr>
                      <th colSpan='2'>Id Externo</th>
                      <th colSpan='2'>Nombre</th>
                      { canEdit &&
                        <th colSpan='2'>Acciones</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {
                      newSalesCenters.map((item, key) => {
                        return (
                          <tr key={key}>
                            <td colSpan='2'>{item.externalId}</td>
                            <td colSpan='2'>{item.name}</td>
                            { canEdit &&
                              <td colSpan='2'>
                                <button
                                  className='button is-primary'
                                  onClick={() => this.showModalSalesCenters(item)}
                                >
                                  Editar
                                </button>
                              </td>
                            }
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>)
  }

  getUnidentifiedProducts () {
    const { dataset, canEdit } = this.state

    if (!dataset.uuid) {
      return <Loader />
    }

    const headerProductsClass = classNames('card-content', {
      'is-hidden': this.state.isProductsOpen === false
    })
    const toggleBtnIconClass = classNames('fa', {
      'fa-angle-down': this.state.isProductsOpen === false,
      'fa-angle-up': this.state.isProductsOpen !== false
    })

    var newProducts = []
    dataset.newProducts.map((item, key) => {
      if (item.isNewExternal) {
        newProducts.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      newProducts.length === 0) {
      return ''
    }

    return (
      <div className='columns'>
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                  Productos no identificados: {newProducts.length}
              </p>
              <div className='field is-grouped is-grouped-right card-header-select'>
                <div className='control'>
                  <a
                    className='button is-inverted'
                    onClick={() => this.toggleUnidentifiedProducts()}>
                    <span className='icon is-small'>
                      <i className={toggleBtnIconClass} />
                    </span>
                  </a>
                </div>
              </div>
            </header>
            <div className={headerProductsClass}>
              <div className='columns'>
                <div className='column'>
                  <table className='table is-fullwidth'>
                    <thead>
                      <tr>
                        <th colSpan='2'>Id Externo</th>
                        <th colSpan='2'>Nombre</th>
                        { canEdit &&
                          <th colSpan='2'>Acciones</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {
                        newProducts.map((item, key) => {
                          return (
                            <tr key={key}>
                              <td colSpan='2'>{item.externalId}</td>
                              <td colSpan='2'>{item.name}</td>
                              { canEdit &&
                                <td colSpan='2'>
                                  <button
                                    className='button is-primary'
                                    onClick={() => this.showModal(item)}
                                  >
                                    Editar
                                  </button>
                                </td>
                              }
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const { dataset, canEdit } = this.state

    if (!dataset.uuid) {
      return <Loader />
    }

    var deleteButton = (
      <DeleteButton
        titleButton={'Eliminar'}
        objectName='Dataset'
        objectDelete={this.deleteObject.bind(this)}
        message={`Estas seguro de que deseas eliminar el dataset ${dataset.name}?`}
      />
    )

    if (!canEdit || dataset.status === 'conciliated') {
      deleteButton = null
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <Link
                      className='button'
                      to={'/projects/' + dataset.project.uuid}
                    >
                      Regresar al proyecto
                    </Link>
                  </div>
                  <div className='control'>
                    {deleteButton}
                  </div>
                </div>
              </div>
            </div>
            {this.getUnidentifiedProducts()}
            {this.getUnidentifiedSalesCenters()}
            {this.getUnidentifiedChannels()}
            <div className='columns'>
              <div className='column is-5-tablet'>
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
        {this.getModalCurrentProduct()}
        {this.getModalSalesCenters()}
        {this.getModalChannels()}
      </div>
    )
  }
}

DataSetDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDataSetDetail = branch({datasets: 'datasets'}, DataSetDetail)

export default Page({
  path: '/datasets/:uuid',
  title: 'Dataset detail',
  icon: 'check',
  exact: true,
  roles: 'enterprisemanager, analyst, orgadmin, admin, opsmanager',
  validate: [loggedIn, verifyRole],
  component: branchedDataSetDetail
})
