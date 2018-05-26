import React, { Component } from 'react'
import Checkbox from '~base/components/base-checkbox'

class Catalogs extends Component {
  constructor (props) {
    super(props)
    this.state = {
      catalogs: [
        {
          title: 'Producto',
          value: 'is_product',
          checked: false
        },
        {
          title: 'Centro de venta',
          value: 'is_saleCenter',
          checked: false
        },
        {
          title: 'Canal',
          value: 'is_channel',
          checked: false
        },
        {
          title: 'Distrito',
          value: 'is_district',
          checked: false
        },
        {
          title: 'División',
          value: 'is_division',
          checked: false
        },
        {
          title: 'Gerencia',
          value: 'is_management',
          checked: false
        },
        {
          title: 'Región',
          value: 'is_region',
          checked: false
        },
        {
          title: 'Marca',
          value: 'is_brand',
          checked: false
        },
        {
          title: 'Categoría',
          value: 'is_category',
          checked: false
        },
        {
          title: 'Ruta',
          value: 'is_route',
          checked: false
        }

      ],
      addedByUser: [],
      addCatalog: ''
    }
  }

  handleCheckboxChange (value, item) {
    console.log(value, item)
    let catalogs = this.state.catalogs
    let index = catalogs.indexOf(item)
    if (index !== -1) {
      catalogs[index].checked = value
    }
  }

  addUserCatalog (e) {
    let value = e.target.value
    if ((e.keyCode === 13 || e.which === 13)) {
      this.setState({
        catalogs: this.state.catalogs.concat(
          {
            title: value.replace(/ /g, '_'),
            value: 'is_' + value.replace(/ /g, '_'),
            checked: true
          }),
        addCatalog: ''
      })
    }
  }

  sendCatalogs () {
    let catalogs = this.state.catalogs.map((item) => {
      if (item.checked) {
        return item.value
      }
    }).filter((item) => { return item })
    this.props.nextStep({catalogs})
  }

  render () {
    return (
      <div className='section'>
        <h1 className='title is-4'>
        Debe seleccionar los campos con los que cuentan sus ventas o catálogos
        </h1>

        <div className='columns is-multiline'>

          {
        this.state.catalogs.map((item, key) => {
          return (
            <div className='column is-3'>
              <Checkbox
                key={key}
                label={item.title}
                handleCheckboxChange={(e, value) => this.handleCheckboxChange(value, item)}
                checked={item.checked}
                disabled={item.disabled}
            />
            </div>
          )
        })
      }
        </div>

        <div className='field'>
          <label className='label'>Agregar catálogo</label>
          <div className='control'>
            <input className='input' type='text' placeholder='Agregar nuevo catálogo'
              value={this.state.addCatalog}
              onKeyDown={(e) => { this.addUserCatalog(e) }}
              onChange={(e) => { this.setState({ addCatalog: e.target.value }) }} />
          </div>
        </div>
        <button onClick={() => this.sendCatalogs()} className='button is-primary is-pulled-right'>Continuar</button>

      </div>
    )
  }
}

export default Catalogs
