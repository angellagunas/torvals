import React, { Component } from 'react'
import Select from '../projects/detail-tabs/select'
import api from '~base/api'
import Loader from '~base/components/spinner'
import tree from '~core/tree'
import { BaseTable } from '~base/components/base-table'
import { toast } from 'react-toastify'

class Labels extends Component {
  constructor (props) {
    super(props)
    this.state = {
      languages: [],
      languageSelected: tree.get('user').language,
      loading: true,
      loadingLabels: false,
      filteredData: []
    }
  }

  componentWillMount () {
    this.getLanguages()
  }
  
  async getLanguages(){
    const url = '/app/languages'
    try {
      const body = await api.get(url)
      this.setState({
        languageSelected: body.data.map(item => {if( item.uuid === this.state.languageSelected) return item.code})[0],
        languages: body.data,
        loading: false
      })
      this.getLabels()
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      
      await this.setState({
        loading: false,
        notFound: true
      })
    }
  }

  async getLabels() {
    const url = '/app/labels'
    this.setState({
      loadingLabels: true, 
      labels: [], 
      filteredData: []
    })
    try {
      const body = await api.get(url, {code: this.state.languageSelected})

      let modules = body.data.map(obj => { return obj.key.split('.')[0] })
      modules = modules.filter((v, i) => { return modules.indexOf(v) == i })

      this.setState({
        labels: body.data,
        modules: modules,
        loadingLabels: false,
        isLoading: '',
        isLoadingSave: '',
        isLoadingRes: '',
      })
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      
      await this.setState({
        loadingLabels: false,
        notFound: true,
        isLoading: '',
        isLoadingSave: '',
        isLoadingRes: '',
      })
    }
  }
  
  changeLanguage(value){
    this.setState({
      languageSelected: value,
      moduleSelected: undefined
    }, () => {
      this.getLabels()
    })
  }

  changeModule(value){
    const data = this.state.labels.map(item => {
      if (item.key.includes(value)){
        return item
      }
    }).filter(item => item)
  
    this.setState({
      moduleSelected: value,
      filteredData: data
    })

  }

  getColumns() {
    const cols = [
      {
        'title': 'Término',
        'default': 'N/A',
        formatter: (row) => {
          return row.text
        }
      },
      {
        'title': 'Reemplazar', 
        'property': 'product.name',
        'default': '',
        formatter: (row) => {
          if(!row.newLabel){
            row.newLabel = ''
          }
          return <input 
          className='input' 
          type='text' 
          value={row.newLabel} 
          onChange={(e) => this.changeLabel(e.target.value, row)} />
        }
      }
    ]

    return cols
  }


  changeLabel(val, row){
    row.newLabel = val
    let aux = this.state.labels
    aux = aux.map(item => {
      if(item.uuid === row.uuid){
        item.newLabel = val
      }
      return item
    })
   
    this.setState({
      labels: aux
    })
  }

  async saveLabels(){
    let updatedLabels = this.state.labels.map(item => {
      if (item.newLabel !== undefined && item.newLabel !== ''){
        return item
      }
    }).filter(item => item)

    if(updatedLabels.length <= 0){
      this.notify('No hay cambios que guardar', 5000, toast.TYPE.INFO)
      
      return
    }

    this.setState({
      isLoading: ' is-loading',
      isLoadingSave: ' is-loading'      
    })

    const url = '/app/labels'
    
    try {
      const body = await api.post(url, { updatedLabels })
      if(body.success){
        this.notify('Cambios guardados con éxito', 5000, toast.TYPE.SUCCESS)
      }
      await this.getLabels()
      await this.changeModule(this.state.moduleSelected)
      
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      
      await this.setState({
        loadingLabels: false,
        notFound: true,
        isLoading: '',
        isLoadingSave: ''  
      })
    }
  }


  async restoreDefault(){
    const url = '/app/labels/default'
    this.setState({ 
      isLoading: ' is-loading',
      isLoadingRes: ' is-loading', 
      loadingLabels: true, 
      labels: [], 
      filteredData: [] })
    try {
      const body = await api.get(url, { code: this.state.languageSelected })

      let modules = body.data.map(obj => { return obj.key.split('.')[0] })
      modules = modules.filter((v, i) => { return modules.indexOf(v) == i })

      this.setState({
        labels: body.data,
        modules: modules,
        loadingLabels: false,
        isLoading: '',
        isLoadingRes: ''
      }, () => {
          this.changeModule(this.state.moduleSelected)
      })
      this.notify('Se restauró el idioma por defecto', 5000, toast.TYPE.INFO)
      
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      
      await this.setState({
        loadingLabels: false,
        notFound: true,
        isLoading: '',
        isLoadingRes: ''        
      })
    }
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false
      })
    }
  }

  render () {
    if (this.state.loading) {
      return <Loader />
    }

    return (
      <div>
        <div className='buttons is-pulled-right'>
          <button className={'button is-primary ' + this.state.isLoadingRes}
            disabled={!!this.state.isLoading}
            onClick={() => this.restoreDefault()}>
            Restaurar
        </button> 
          <button className={'button is-success ' + this.state.isLoadingSave}
          disabled={!!this.state.isLoading}
          onClick={() => this.saveLabels()}>
          Guardar Cambios
        </button>
        
        </div>
        <Select
          label='Idioma seleccionado:'
          name='language'
          value={this.state.languageSelected}
          optionValue='code'
          optionName='name'
          options={this.state.languages}
          onChange={(name, value) => { this.changeLanguage(value) }}
        />

        {this.state.loadingLabels ?
          <Loader />
          :
          this.state.labels ?
            <Select
              placeholder='Seleccione un módulo'
              label='Módulo'
              name='module'
              value={this.state.moduleSelected}
              options={this.state.modules}
              onChange={(name, value) => { this.changeModule(value) }}
            />
            :
            <Loader />

        }

        {this.state.moduleSelected && this.state.labels && this.state.filteredData.length > 0 &&
          <div>
            <div className='scroll-table'>
              <div className='scroll-table-container'>
                <BaseTable
                className='labels-table is-bordered is-striped is-narrow is-hoverable is-fullwidth'
                  data={this.state.filteredData}
                  columns={this.getColumns()}
                />
              </div>
            </div>
          </div>
        }
      
      </div>
    )
  }
}

export default Labels