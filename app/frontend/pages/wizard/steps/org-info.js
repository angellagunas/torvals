import React, { Component } from 'react'

class OrgInfo extends Component {
  render () {
    let org = this.props.org
    return (
      <div className='container'>
        Bienvenido al asistente de configuración de Orax.
        Primero revisa los datos de tu organización.
        Cuando todo este correcto da click en guardar y continuar.
        {org &&
        <div>
          <figure className='image is-128x128'>
            <img src={org.profileUrl} />
          </figure>
          <p>{org.name}</p>
          <p>{org.slug}</p>
          <p>{org.description}</p>
        </div>
        }
        <button onClick={() => this.props.nextStep()} className='button is-primary'>Continuar</button>
      </div>
    )
  }
}

export default OrgInfo
