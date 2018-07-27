import React, { Component } from 'react'

class Contact extends Component {
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
                <h2 className='subtitle'>
                  Orax te da la libertad de seleccionar la forma en le das forma a tus datos
                  </h2>
              </div>
              <div className='column is-offset-1'>
                <div className='columns'>
                  <div className='column'>
                    <div className='field'>
                      <label className='label'>Nombre</label>
                      <div className='control'>
                        <input className='input' type='text' placeholder='Josué' />
                      </div>
                    </div>
                  </div>
                  <div className='column'>
                    <div className='field'>
                      <label className='label'>Apellido</label>
                      <div className='control'>
                        <input className='input' type='text' placeholder='Monroy' />
                      </div>
                    </div>
                  </div>
                </div>

                <div className='columns'>
                  <div className='column'>
                    <div className='field'>
                      <label className='label'>Empresa u Organización</label>
                      <div className='control'>
                        <input className='input' type='text' placeholder='Grupo Monroy' />
                      </div>
                    </div>
                  </div>
                </div>

                <div className='columns'>
                  <div className='column'>
                    <div className='field'>
                      <label className='label'>Número de empleados</label>
                      <div className='control'>
                        <input className='input' type='text' placeholder='50' />
                      </div>
                    </div>
                  </div>
                  <div className='column'>
                    <div className='field'>
                      <label className='label'>País</label>
                      <div className='control'>
                        <input className='input' type='text' placeholder='México' />
                      </div>
                    </div>
                  </div>
                </div>

                <button className='button is-primary is-pulled-right'>
                  Enviar
                  </button>

              </div>
            </div>
          </div>
        </div>

      </section>
    )
  }
}

export default Contact
