import React, { Component } from 'react'
import api from '~base/api'

class Contact extends Component {
  constructor (props) {
    super(props)
    this.state = {
      contact: {
        email: '',
        name: '',
        org: '',
        employees: '',
        country: ''
      },
      success: false
    }
  }

  async contact (e) {
    e.preventDefault()
    this.setState({
      loading: 'is-loading'
    })
    try {
      let url = '/contact'
      let res = await api.post(url,
        {
          ...this.state.contact
        })

      if (res.success) {
        this.setState({
          success: true,
          contact: {
            email: '',
            name: '',
            org: '',
            employees: '',
            country: ''
          },
          loading: ''
        }, () => {
          setTimeout(() => {
            this.setState({
              success: false
            })
          }, 5000)
        })
      }

      return true
    } catch (e) {
      console.log(e)
      this.setState({
        fail: true,
        loading: ''
      }, () => {
        setTimeout(() => {
          this.setState({
            success: false
          })
        }, 5000)
      })
      return false
    }
  }

  handleChange (name, val) {
    let aux = this.state.contact

    aux[name] = val

    this.setState({
      contact: aux
    })
  }

  render () {
    return (
      <section className='hero is-medium is-bg-whitesmoke'>
        <div className='hero-body'>
          <div className='container'>
            <div className='columns'>
              <div className='column is-6'>
                <h1 className='title'>
                  ¿Necesitas más información?
                  </h1>
                <h2>
                  Creamos un paquete y cotización especialmente a tus necesidades.
                  Solicitala y uno de nuestros agentes se pondrá en contacto contigo para ayudarte.
                </h2>
              </div>
              <div className='column is-offset-1'>
                <form onSubmit={(e) => this.contact(e)}>
                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Nombre</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='Josué Monroy'
                            value={this.state.contact.name}
                            onChange={(e) => this.handleChange('name', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Correo</label>
                        <div className='control'>
                          <input className='input' type='email' placeholder='jm@empresa.com'
                            value={this.state.contact.email}
                            onChange={(e) => this.handleChange('email', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Empresa u Organización</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='Grupo Monroy'
                            value={this.state.contact.org}
                            onChange={(e) => this.handleChange('org', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Número de empleados</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='50'
                            value={this.state.contact.employees}
                            onChange={(e) => this.handleChange('employees', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>País</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='México'
                            value={this.state.contact.country}
                            onChange={(e) => this.handleChange('country', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className={'button is-primary is-pulled-right ' + this.state.loading}
                    type='submit'
                    disabled={!!this.state.loading}>
                  Enviar
                </button>
                  {this.state.success &&
                    <div className='message is-primary contact-msg is-pulled-right'>
                      <div className='message-body has-text-primary'>
                        Enviado, un agente recibirá tus datos y se comunicará posteriormente.
                      </div>
                    </div>
                  }
                  {this.state.fail &&
                    <div className='message is-danger contact-msg is-pulled-right'>
                      <div className='message-body has-text-danger'>
                        Ocurrió un error, intenta más tarde.
                      </div>
                    </div>
                  }

                </form>

              </div>
            </div>
          </div>
        </div>

      </section>
    )
  }
}

export default Contact
