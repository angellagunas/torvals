import React, { Component } from 'react'
import Checkbox from '~base/components/base-checkbox'
import slugify from 'underscore.string/slugify'
import DeleteButton from '~base/components/base-deleteButton'

class Catalogs extends Component {
  constructor (props) {
    super(props)
    this.state = {
      catalogs: [
        {
          title: 'Producto',
          value: 'producto',
          checked: true,
          disabled: true
        },
        {
          title: 'Precio',
          value: 'precio',
          checked: true,
          disabled: true
        },
        {
          title: 'Centro de venta',
          value: 'centro-de-venta',
          checked: false
        },
        {
          title: 'Canal',
          value: 'canal',
          checked: false
        },
        {
          title: 'Distrito',
          value: 'distrito',
          checked: false
        },
        {
          title: 'División',
          value: 'division',
          checked: false
        },
        {
          title: 'Gerencia',
          value: 'gerencia',
          checked: false
        },
        {
          title: 'Región',
          value: 'region',
          checked: false
        },
        {
          title: 'Marca',
          value: 'marca',
          checked: false
        },
        {
          title: 'Categoría',
          value: 'categoria',
          checked: false
        },
        {
          title: 'Ruta',
          value: 'ruta',
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
            value: slugify(value),
            checked: true,
            delete: true
          }),
        addCatalog: ''
      })
    }
  }

  sendCatalogs () {
    let catalogs = this.state.catalogs.map((item) => {
      if (item.checked && item.value !== 'precio') {
        return {
          name: item.title,
          slug: slugify(item.value)
        }
      }
    }).filter((item) => { return item })
    this.props.nextStep({catalogs}, 1)
  }

  componentWillMount () {
    let rules = this.props.rules.catalogs
    let catalog = this.state.catalogs
    rules.map((item) => {
      let findIt = false

      for (const c of catalog) {
        if (item.slug === c.value) {
          c.checked = true
          findIt = true
        }
      }

      if (!findIt) {
        catalog.push({
          title: item.name,
          value: item.slug,
          checked: true,
          delete: true
        })
      }
    })

    this.setState({
      catalogs: catalog
    })
  }

  removeItem (item) {
    let catalogs = this.state.catalogs
    let index = catalogs.indexOf(item)
    if (index !== -1) {
      delete catalogs[index]
    }
    this.setState({
      catalogs
    })
  }

  render () {
    return (
      <div className='section pad-sides has-20-margin-top catalogs'>
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
                          <div className='field is-grouped'>
                            <div className='control'>
                              <Checkbox
                                key={key}
                                label={item.title.replace(/-/g, ' ')}
                                handleCheckboxChange={(e, value) => this.handleCheckboxChange(value, item)}
                                checked={item.checked}
                                disabled={item.disabled}
                              />
                            </div>
                            <div className='control'>
                              {item.delete &&
                                <DeleteButton
                                  objectName='Catálogo'
                                  objectDelete={() => this.removeItem(item)}
                                  message={<span>¿Estas seguro de querer eliminar este Catálogo?<br /> Los elementos de éste catálogo ya no estarán disponibles</span>}
                                  small
                                />
                              }
                            </div>
                          </div>

                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='buttons wizard-steps has-margin-big'>
          {this.props.org && !this.props.org.isConfigured &&
            this.props.completed && this.props.completed.length < 4
            ? <button onClick={() => this.props.setStep(4)} className='button is-primary'>Atrás</button>
            : <button onClick={() => this.props.setStep(1)} className='button is-danger'>Cancelar</button>
          }
          <button
            onClick={() => this.sendCatalogs()}
            className='button is-primary'>
            {this.props.org && !this.props.org.isConfigured &&
              this.props.completed && this.props.completed.length < 4
              ? 'Siguente' : 'Guardar'
            }
          </button>
        </div>
      </div>
    )
  }
}

export default Catalogs
