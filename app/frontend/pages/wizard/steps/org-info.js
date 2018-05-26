import React, { Component } from 'react'

class OrgInfo extends Component {
  render () {
    let org = this.props.org
    return (
      <div className='section'>

        {org &&
        <div className='columns'>
          <div className='column is-6'>
            <h1 className='title'> Bienvenido al asistente de configuración de Orax. </h1>
            <h2 className='subtitle'> Primero revisa los datos de tu organización.
            Cuando todo este correcto da click en guardar y continuar.
          </h2>
          </div>
          <div className='column is-3 is-offset-1'>
            <div className='card'>
              <div className='card-image'>
                <figure className='image is-1by1'>
                  <img src={org.profileUrl} />
                </figure>
              </div>
              <div className='card-content'>
                <div className='media'>
                  <div className='media-content'>
                    <p className='title is-4'>{org.name}</p>
                    <p className='subtitle is-6'>{org.slug}</p>
                  </div>
                </div>

                <div className='content'>
                  {org.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        }
        <button onClick={() => this.props.nextStep()} className='button is-primary is-pulled-right'>Continuar</button>
      </div>
    )
  }
}

export default OrgInfo
