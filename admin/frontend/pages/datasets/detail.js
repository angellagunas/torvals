import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import FontAwesome from 'react-fontawesome'
import env from '~base/env-variables'
import classNames from 'classnames'
import { toast, ToastContainer } from 'react-toastify'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import DatasetDetailForm from './detail-form'
import { UploadDataset } from '~base/components/base-uploads'
import ConfigureDatasetForm from './configure-form'
import DeleteButton from '~base/components/base-deleteButton'
import ConfigureViewDataset from './configure-view'
import BaseModal from '~base/components/base-modal'
import ProductForm from './edit-product'
import SalesCenterForm from './edit-salescenter'
import ChannelForm from './edit-channel'
import Checkbox from '~base/components/base-checkbox'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'

class DataSetDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      classNameSC: '',
      isProductsOpen: false,
      isSalesCenterOpen: false,
      isChannelsOpen: false,
      loading: true,
      loaded: false,
      dataset: {},
      organizations: [],
      currentProduct: null,
      currentSalesCenter: null,
      currentChannel: null,
      isLoading: '',
      isLoadingConsolidate: '',
      isLoadingConfigure: '',
      selectedProducts: new Set(),
      selectAllProducts: false,
      selectAllSalesCenters: false,
      selectedSalesCenters: new Set(),
      selectAllChannels: false,
      selectedChannels: new Set(),
      disableBtnC: true,
      isLoadingBtnC: '',
      disableBtnP: true,
      isLoadingBtnP: '',
      disableBtnS: true,
      isLoadingBtnS: ''
    }

    this.products = []
    this.channels = []
    this.salesCenters = []
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
    this.loadOrgs()

    this.interval = setInterval(() => {
      if (this.state.dataset.status === 'preprocessing' ||
        this.state.dataset.status === 'processing' ||
        this.state.dataset.status === 'uploaded' ||
        this.state.dataset.status === 'pendingRows') {
        this.load()
      }
    }, 30000)
  }

  componentWillUnmount () {
    clearInterval(this.interval)
  }

  async load () {
    var url = '/admin/datasets/' + this.props.match.params.uuid
    try{
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        dataset: body.data
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }  

  }

  async loadOrgs () {
    var url = '/admin/organizations/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      organizations: body.data
    })
  }

  changeHandler (data) {
    this.setState({
      dataset: data
    })
  }

  async deleteObject () {
    var url = `/admin/projects/${this.state.dataset.project.uuid}/remove/dataset`
    await api.post(url, { dataset: this.props.match.params.uuid })
    this.props.history.push('/admin/datasets')
  }

  async configureOnClick () {
    this.setState({ isLoadingConfigure: ' is-loading' })
    var url = '/admin/datasets/' + this.props.match.params.uuid + '/set/configure'
    await api.post(url)
    await this.load()
    this.setState({ isLoadingConfigure: '' })
  }

  async consolidateOnClick () {
    this.setState({ isLoadingConsolidate: ' is-loading' })
    var url = '/admin/datasets/' + this.props.match.params.uuid + '/set/conciliate'
    await api.post(url)
    await this.load()
    this.setState({ isLoadingConsolidate: '' })
    this.props.history.push(`/admin/projects/detail/${this.state.dataset.project.uuid}`)
  }

  async cancelOnClick () {
    await this.configureOnClick()
  }

  getUpload () {
    let dataset = this.state.dataset
    let url = ''
    
    if (env.ENV === 'production') {
      url = `/api/admin/upload/`
    } else {
      url = `${env.API_HOST}/api/admin/upload/`
    }

    if (
      (!dataset.fileChunk && dataset.source === 'uploaded') ||
      (dataset.fileChunk && dataset.status === 'uploading')
    ) {
      return (
        <div className='column'>
          <UploadDataset
            query={{dataset: this.state.dataset.uuid}}
            load={() => { this.load() }}
            url={url}
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
                      <button
                        className={'button is-black' + this.state.isLoadingConfigure}
                        disabled={!!this.state.isLoadingConfigure}
                        onClick={e => this.cancelOnClick()}
                      >
                        Cancelar
                      </button>
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
                Configurando el Dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>
                  <ConfigureDatasetForm
                    initialState={dataset}
                    columns={dataset.columns || []}
                    url={'/admin/datasets/' + dataset.uuid + '/configure'}
                    changeHandler={(data) => this.changeHandler(data)}
                    load={this.load.bind(this)}
                  />
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
    } else if (dataset.status === 'error') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Estado del dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-danger'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon is-large'>
                        <FontAwesome className='fa-3x' name='warning' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      Se ha generado un error! {dataset.error}
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

  getHeight (element) {
    if (this.state.bodyHeight === 0) {
      if (element) this.setHeights([element])
    }
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

  showModal (item) {
    if (!item.category) {
      item.category = ''
    }
    if (!item.subcategory) {
      item.subcategory = ''
    }
    this.setState({
      currentProduct: item,
      className: ' is-active'
    })
  }

  hideModal () {
    this.setState({
      className: '',
      currentProduct: null,
      isLoading: ''
    })
  }

  showModalSalesCenters (item) {
    this.setState({
      currentSalesCenter: item,
      classNameSC: ' is-active'
    })
  }

  hideModalSalesCenters () {
    this.setState({
      classNameSC: '',
      currentSalesCenter: null,
      isLoading: ''
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
      currentChannel: null,
      isLoading: ''
    })
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finishUp () {
    this.setState({ isLoading: '' })
  }

  getModalCurrentProduct () {
    if (this.state.currentProduct) {
      return (<BaseModal
        title='Edit Product'
        className={this.state.className}
        hideModal={() => this.hideModal()}
        >
        <ProductForm
          baseUrl='/admin/products'
          url={'/admin/products/' + this.state.currentProduct.uuid}
          submitHandler={(data) => this.submitHandler(data)}
          initialState={this.state.currentProduct}
          load={this.deleteNewProduct.bind(this)}
          errorHandler={(data) => this.errorHandler(data)}
          >
          <div className='field is-grouped'>
            <div className='control'>
              <button
                className={'button is-primary ' + this.state.isLoading}
                disabled={!!this.state.isLoading}
                type='submit'
                >
                Guardar
              </button>
            </div>
            <div className='control'>
              <button className='button' onClick={() => this.hideModal()} type='button'>Cancelar</button>
            </div>
          </div>
        </ProductForm>
      </BaseModal>)
    }
  }

  getModalSalesCenters () {
    if (this.state.currentSalesCenter) {
      return (<BaseModal
        title='Edit Sales Center'
        className={this.state.classNameSC}
        hideModal={() => this.hideModalSalesCenters()}
    >
        <SalesCenterForm
          baseUrl='/admin/salesCenters'
          url={'/admin/salesCenters/' + this.state.currentSalesCenter.uuid}
          initialState={this.state.currentSalesCenter}
          load={this.deleteNewSalesCenter.bind(this)}
          submitHandler={(data) => this.submitHandler(data)}
          errorHandler={(data) => this.errorHandler(data)}
        >
          <div className='field is-grouped'>
            <div className='control'>
              <button
                className={'button is-primary ' + this.state.isLoading}
                disabled={!!this.state.isLoading}
                type='submit'
                >
                Guardar
              </button>
            </div>
            <div className='control'>
              <button
                className='button'
                onClick={() => this.hideModalSalesCenters()}
                type='button'
              >
                Cancelar
              </button>
            </div>
          </div>
        </SalesCenterForm>
      </BaseModal>)
    }
  }

  getModalChannels () {
    if (this.state.currentChannel) {
      return (<BaseModal
        title='Editar Canal'
        className={this.state.classNameCh}
        hideModal={() => this.hideModalChannels()} >
        <ChannelForm
          baseUrl='/admin/channels'
          url={'/admin/channels/' + this.state.currentChannel.uuid}
          initialState={this.state.currentChannel}
          submitHandler={(data) => this.submitHandler(data)}
          errorHandler={(data) => this.errorHandler(data)}
          load={this.deleteNewChannel.bind(this)}>
          <div className='field is-grouped'>
            <div className='control'>
              <button
                className={'button is-primary ' + this.state.isLoading}
                disabled={!!this.state.isLoading}
                type='submit'
              >
                Guardar
              </button>
            </div>
            <div className='control'>
              <button className='button' onClick={() => this.hideModalChannels()} type='button'>Cancelar</button>
            </div>
          </div>
        </ChannelForm>
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
    const { dataset } = this.state
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

    this.channels = []
    dataset.channels.map((item, key) => {
      if (item.isNewExternal) {
        this.channels.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      this.channels.length === 0) {
      return ''
    }

    return (<div className='columns'>
      <div className='column'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
                Canales no identificados: {this.channels.length}
            </p>
            <div className='field is-grouped is-grouped-right card-header-select'>
              <div className={this.state.isChannelsOpen ? 'control' : 'is-hidden'}>
                <button
                  onClick={() => this.confirmChannels()}
                  disabled={this.state.disableBtnC || !!this.state.isLoadingBtnC}
                  className={'button is-primary is-outlined is-pulled-right' + this.state.isLoadingBtnC}
                >
                  Confirmar ({this.state.selectedChannels.size})
                </button>
              </div> 
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
                      <th colSpan='1'>Id Externo</th>
                      <th colSpan='1'>Nombre</th>
                      <th colSpan='1'>Acciones</th>
                      <th colSpan='1'>
                        <span title='Seleccionar todos'>
                          <Checkbox
                            label='checkAll'
                            handleCheckboxChange={(e) => this.checkAllChannels(!this.state.selectAllChannels)}
                            key='checkAll'
                            checked={this.state.selectAllChannels}
                            hideLabel />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      this.channels.map((item, key) => {
                        if (!item.selected) {
                          item.selected = false
                        }
                        return (
                          <tr key={key}>
                            <td colSpan='1'>{item.externalId}</td>
                            <td colSpan='1'>{item.name}</td>
                            <td colSpan='1'>
                              <button className='button is-primary' onClick={() => this.showModalChannels(item)}>
                                  Editar
                              </button>
                            </td>
                            <td colSpan='1'>
                              <Checkbox
                                label={item}
                                handleCheckboxChange={this.toggleCheckboxChannels}
                                key={item.externalId}
                                checked={item.selected}
                                hideLabel />
                            </td>
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
    const { dataset } = this.state
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

    this.salesCenters = []
    dataset.salesCenters.map((item, key) => {
      if (item.isNewExternal) {
        this.salesCenters.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      this.salesCenters.length === 0) {
      return ''
    }

    return (<div className='columns'>
      <div className='column'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
                Centros de Venta no identificados: {this.salesCenters.length}
            </p>
            <div className='field is-grouped is-grouped-right card-header-select'>
              <div className={this.state.isSalesCenterOpen ? 'control' : 'is-hidden'}>
                <button
                  onClick={() => this.confirmSalesCenters()}
                  disabled={this.state.disableBtnS || !!this.state.isLoadingBtnS}
                  className={'button is-primary is-outlined is-pulled-right' + this.state.isLoadingBtnS}
                >
                  Confirmar ({this.state.selectedSalesCenters.size})
                </button>
              </div> 
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
                      <th colSpan='1'>Id Externo</th>
                      <th colSpan='1'>Nombre</th>
                      <th colSpan='1'>Acciones</th>
                      <th colSpan='1'>
                        <span title='Seleccionar todos'>
                          <Checkbox
                            label='checkAll'
                            handleCheckboxChange={(e) => this.checkAllSalesCenters(!this.state.selectAllSalesCenters)}
                            key='checkAll'
                            checked={this.state.selectAllSalesCenters}
                            hideLabel />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      this.salesCenters.map((item, key) => {
                        if (!item.selected) {
                          item.selected = false
                        }
                        return (
                          <tr key={key}>
                            <td colSpan='1'>{item.externalId}</td>
                            <td colSpan='1'>{item.name}</td>
                            <td colSpan='1'>
                              <button className='button is-primary' onClick={() => this.showModalSalesCenters(item)}>
                                  Editar
                                </button>
                            </td>
                            <td colSpan='1'>
                              <Checkbox
                                label={item}
                                handleCheckboxChange={this.toggleCheckboxSalesCenters}
                                key={item.externalId}
                                checked={item.selected}
                                hideLabel />
                            </td>
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
    const { dataset } = this.state

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

    this.products = []
    dataset.products.map((item, key) => {
      if (item.isNewExternal) {
        this.products.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      this.products.length === 0) {
      return ''
    }

    return (
      <div className='columns'>
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                  Productos no identificados: {this.products.length}
              </p>
              <div className='field is-grouped is-grouped-right card-header-select'>
                <div className={this.state.isProductsOpen ? 'control' : 'is-hidden'}>
                  <button
                    onClick={() => this.confirmProducts()}
                    disabled={this.state.disableBtnP || !!this.state.isLoadingBtnP}
                    className={'button is-primary is-outlined is-pulled-right' + this.state.isLoadingBtnP}
                  >
                    Confirmar ({this.state.selectedProducts.size})
                  </button>
                </div> 
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
                        <th colSpan='1'>Id Externo</th>
                        <th colSpan='1'>Nombre</th>
                        <th colSpan='1'>Acciones</th>
                        <th colSpan='1'>
                        <span title='Seleccionar todos'>
                          <Checkbox
                            label='checkAll'
                            handleCheckboxChange={(e) => this.checkAllProducts(!this.state.selectAllProducts)}
                            key='checkAll'
                            checked={this.state.selectAllProducts}
                            hideLabel />
                        </span>    
                        </th>
                        
                      </tr>
                    </thead>
                    <tbody>
                      {
                        this.products.map((item, key) => {
                          if(!item.selected){
                            item.selected = false
                          }
                          return (
                            <tr key={key}>
                              <td colSpan='1'>{item.externalId}</td>
                              <td colSpan='1'>{item.name}</td>
                              <td colSpan='1'>
                                <button className='button is-primary' onClick={() => this.showModal(item)}>
                                    Editar
                                </button>
                              </td>
                              <td colSpan='1'>
                                <Checkbox
                                  label={item}
                                  handleCheckboxChange={this.toggleCheckboxProducts}
                                  key={item.externalId}
                                  checked={item.selected}
                                  hideLabel />
                              </td>
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

  checkAllProducts = (check) => {
    this.state.selectedProducts.clear()
    for (let item of this.products) {
      if (check)
        this.state.selectedProducts.add(item)
      
        item.selected = check
    }
    this.setState({ selectAllProducts: check }, function () {
      this.toggleButtons()
    })
  }

  toggleCheckboxProducts = (item, all) => {
    if (this.state.selectedProducts.has(item) && !all) {
      this.state.selectedProducts.delete(item)
      item.selected = false
    }
    else {
      this.state.selectedProducts.add(item)
      item.selected = true 
    }

    this.toggleButtons()
  }

  checkAllSalesCenters = (check) => {
    this.state.selectedSalesCenters.clear()
    for (let item of this.salesCenters) {
      if (check)
        this.state.selectedSalesCenters.add(item)

      item.selected = check
    }
    this.setState({ selectAllSalesCenters: check }, function () {
      this.toggleButtons()
    })
  }

  toggleCheckboxSalesCenters = (item, all) => {
    if (this.state.selectedSalesCenters.has(item) && !all) {
      this.state.selectedSalesCenters.delete(item)
      item.selected = false
    }
    else {
      this.state.selectedSalesCenters.add(item)
      item.selected = true
    }

    this.toggleButtons()
  }

  checkAllChannels = (check) => {
    this.state.selectedChannels.clear()
    for (let item of this.channels) {
      if (check)
        this.state.selectedChannels.add(item)

      item.selected = check
    }
    this.setState({ selectAllChannels: check }, function () {
      this.toggleButtons()
    })
  }

  toggleCheckboxChannels = (item, all) => {
    if (this.state.selectedChannels.has(item) && !all) {
      this.state.selectedChannels.delete(item)
      item.selected = false
    }
    else {
      this.state.selectedChannels.add(item)
      item.selected = true
    }

    this.toggleButtons()
  }


  toggleButtons() {
    let disableP = true
    let disableS = true
    let disableC = true

    if (this.state.selectedProducts.size > 0)
      disableP = false
    if(this.state.selectedChannels.size > 0)
      disableC = false
    if(this.state.selectedSalesCenters.size > 0)
      disableS = false

    this.setState({
      disableBtnP: disableP,
      disableBtnS: disableS,
      disableBtnC: disableC      
    })
  }

  async confirmProducts () {
    this.setState({
      isLoadingBtnP: ' is-loading'
    })

    const url = '/admin/products/approve'
    let products = Array.from(this.state.selectedProducts).map(item => {
      return {
        ...item,
        category: item.category || '',
        subcategory: item.subcategory || '',
      }
    })

    try {
      let res = await api.post(url, products)

      if (res.success > 0) {
        this.notify(`¡Se confirmaron exitosamente ${res.success} productos!`, 5000, toast.TYPE.SUCCESS)
      }

      if (res.error > 0) {
        this.notify(`¡No se pudieron confirmar ${res.error} productos!` , 5000, toast.TYPE.ERROR)
      }

      if (res.error === 0 && res.success === 0) {
        this.notify('¡Error al confirmar productos!' , 5000, toast.TYPE.ERROR)
      }
    } catch(e){
      this.notify('¡Error al confirmar productos!' , 5000, toast.TYPE.ERROR) 
    }
    
    this.setState({
      selectedProducts: new Set(),
      selectAllProducts: false,
      isLoadingBtnP: ''
    }, function () {
      this.toggleButtons()
      this.load()
    })
  }

  async confirmSalesCenters() {
    this.setState({
      isLoadingBtnS: ' is-loading'
    })

    const url = '/admin/salesCenters/approve'
    try {
      let res = await api.post(url, Array.from(this.state.selectedSalesCenters))

      if (res.success > 0) {
        this.notify(
          `¡Se confirmaron exitosamente ${res.success} centros de venta!`,
          5000,
          toast.TYPE.SUCCESS
        )
      }

      if (res.error > 0) {
        this.notify(
          `¡No se pudieron confirmar ${res.error} centros de venta!`,
          5000,
          toast.TYPE.ERROR
        )
      }

      if (res.error === 0 && res.success === 0) {
        this.notify('¡Error al confirmar centros de venta!' , 5000, toast.TYPE.ERROR)
      }
    } catch(e){
      this.notify('¡Error al confirmar centros de venta!', 5000, toast.TYPE.ERROR) 
    }

    this.setState({
      selectedSalesCenters: new Set(),
      selectAllSalesCenters: false,
      isLoadingBtnS: ''
    }, function () {
      this.toggleButtons()
      this.load()
    })
  }

  async confirmChannels() {
    this.setState({
      isLoadingBtnC: ' is-loading'
    })

    const url = '/admin/channels/approve'
    try {
      let res = await api.post(url, Array.from(this.state.selectedChannels))

      if (res.success > 0) {
        this.notify(
          `¡Se confirmaron exitosamente ${res.success} canales!`,
          5000,
          toast.TYPE.SUCCESS
        )
      }

      if (res.error > 0) {
        this.notify(
          `¡No se pudieron confirmar ${res.error} canales!`,
          5000,
          toast.TYPE.ERROR
        )
      }

      if (res.error === 0 && res.success === 0) {
        this.notify('¡Error al confirmar canales!' , 5000, toast.TYPE.ERROR)
      }
    } catch(e){
      this.notify('¡Error al confirmar canales!', 5000, toast.TYPE.ERROR) 
    }

    this.setState({
      selectedChannels: new Set(),
      selectAllChannels: false,
      isLoadingBtnC: ''
    }, function () {
      this.toggleButtons()
      this.load()
    })
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
    this.toastId = toast(message, {
      autoClose: timeout,
      type: type,
      hideProgressBar: true,
      closeButton: false
    })
  }

  render () {
    if (this.state.notFound) {
      return <NotFound msg='este dataset' />
    }
    const { dataset } = this.state

    if (!dataset.uuid) {
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
                  path: '/admin/datasets',
                  label: 'Datasets',
                  current: false
                },
                {
                  path: '/admin/datasets/detail/',
                  label: 'Detalle',
                  current: true
                },
                {
                  path: '/admin/datasets/detail/',
                  label: dataset.name,
                  current: true
                }
              ]}
              align='left'
            />
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <Link
                      className='button'
                      to={'/projects/detail/' + dataset.project.uuid}
                    >
                      Regresar al proyecto
                    </Link>
                  </div>
                  { dataset.status !== 'conciliated' &&
                    <div className='control'>
                      <DeleteButton
                        titleButton={'Eliminar'}
                        objectName='Dataset'
                        objectDelete={this.deleteObject.bind(this)}
                        message={`¿Estas seguro de que deseas eliminar el dataset ${dataset.name}?`}
                      />
                    </div>
                  }
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
                          baseUrl='/admin/datasets'
                          url={'/admin/datasets/' + this.props.match.params.uuid}
                          initialState={{
                            name: this.state.dataset.name,
                            description: this.state.dataset.description,
                            organization: this.state.dataset.organization.uuid,
                            status: dataset.status
                          }}
                          load={this.load.bind(this)}
                          organizations={this.state.organizations}
                          submitHandler={(data) => this.submitHandler(data)}
                          errorHandler={(data) => this.errorHandler(data)}
                          finishUp={(data) => this.finishUp(data)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button
                                className={'button is-primary ' + this.state.isLoading}
                                disabled={!!this.state.isLoading}
                                type='submit'
                              >
                                Guardar
                              </button>
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
        <ToastContainer />
      </div>
    )
  }
}

DataSetDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDataSetDetail = branch({datasets: 'datasets'}, DataSetDetail)

export default Page({
  path: '/datasets/detail/:uuid',
  title: 'Dataset detail',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  component: branchedDataSetDetail
})
