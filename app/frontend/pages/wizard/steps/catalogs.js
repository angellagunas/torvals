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
          checked: true,
          disabled: true
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
      addCatalog: ''
    }
  }

  handleCheckboxChange (value, item) {
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
            title: value,
            value: value.replace(/ /g, '_'),
            checked: true
          }),
        addCatalog: ''
      })
    }
  }

  sendCatalogs () {
    let catalogs = this.state.catalogs.map((item) => {
      if (item.checked) {
        return item.title.replace(/ /g, '_').toLowerCase()
      }
    }).filter((item) => { return item })
    this.props.nextStep({catalogs})
  }

  componentWillMount () {
    let rules = this.props.rules.catalogs
    let catalog = this.state.catalogs
    rules.map((item) => {
      let findIt = false

      for (const c of catalog) {
        if (item === c.title.replace(/ /g, '_').toLowerCase()) {
          c.checked = true
          findIt = true
          break
        }
      }

      if (!findIt) {
        this.setState({
          catalogs: this.state.catalogs.concat(
            {
              title: item,
              value: item,
              checked: true
            })
        })
      }
    })
  }
  render () {
    return (
      <div className='section pad-sides has-20-margin-top'>
        <h1 className='title is-5'> Catálogos de ventas</h1>
        <p className='subtitle is-6'>Selecciona los campos con los que cuentan tus ventas o catálogos.</p>
        <div className='columns is-centered'>
          <div className='column'>

            <div className='field'>
              <label className='label'>Agregar catálogo</label>
              <div className='control'>
                <input className='input' type='text' placeholder='Agregar nuevo catálogo'
                  value={this.state.addCatalog}
                  onKeyDown={(e) => { this.addUserCatalog(e) }}
                  onChange={(e) => { this.setState({ addCatalog: e.target.value }) }} />
              </div>
            </div>

            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Selecciona campos
                </p>
              </header>
              <div className='card-content'>
                <div className='columns is-multiline'>

                  {
                    this.state.catalogs.map((item, key) => {
                      return (
                        <div className='column is-3 is-capitalized' key={key}>
                          <Checkbox
                            key={key}
                            label={item.title.replace(/_/g, ' ')}
                            handleCheckboxChange={(e, value) => this.handleCheckboxChange(value, item)}
                            checked={item.checked}
                            disabled={item.disabled}
                          />
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
        <center>
          <button onClick={() => this.sendCatalogs()} className='button is-primary'>Guardar</button>
        </center>
      </div>
    )
  }
}

export default Catalogs
