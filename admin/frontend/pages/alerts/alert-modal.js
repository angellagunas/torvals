import React, { Component } from 'react'
import api from '~base/api'

class AlertModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      data: {},
      loading: ''
    }
  }

  componentWillReceiveProps (next) {
    if (next.alertSelected !== this.state.data) {
      this.setState({
        data: Object.assign({}, next.alertSelected)
      })
    }
  }

  handleInputChange (e, input) {
    let aux = this.state.data
    let val = e.target.value

    if (input === 'status') {
      if (e.target.checked) {
        val = 'active'
      } else {
        val = 'inactive'
      }
    }

    aux[input] = val

    this.setState({
      data: Object.assign({}, aux)
    })
  }

  async handleSubmit (e) {
    e.preventDefault()
    this.setState({
      loading: ' is-loading'
    })
    try {
      let url = '/admin/alerts/' + this.state.data.uuid
      let res = await api.post(url, {
        ...this.state.data
      })
      this.setState({
        loading: ''
      })
      if (res) {
        this.props.finishUp()
        this.props.toggleModal()
      }
    } catch (e) {
      console.log(e)
      this.setState({
        loading: ''
      })
    }
  }

  render () {
    return (
      <div className={'modal ' + this.props.alertModal}>
        <div className='modal-background' onClick={() => { this.props.toggleModal() }} />
        <div className='modal-card'>
          <header className='modal-card-head'>
            <p className='modal-card-title'>{this.props.alertSelected.name}</p>
            <button className='delete' aria-label='close' onClick={() => { this.props.toggleModal() }} />
          </header>
          <section className='modal-card-body'>

            <form onSubmit={(e) => this.handleSubmit(e)} >
              <div className='field'>
                <label className='checkbox alert-active'>
                  <input
                    type='checkbox'
                    checked={this.state.data.status === 'active'}
                    onChange={(e) => this.handleInputChange(e, 'status')}
                  />
                  <span>Activar</span>
                </label>
              </div>

              <div className='field'>
                <label className='label'>Nombre</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder='Text input'
                    value={this.state.data.name}
                    onChange={(e) => this.handleInputChange(e, 'name')} />
                </div>
              </div>

              <div className='field'>
                <label className='label'>Tipo</label>
                <div className='control'>
                  <div className='select'>
                    <select value={this.state.data.type} onChange={(e) => this.handleInputChange(e, 'type')}>
                      <option value={'email'}>Email</option>
                      <option value={'push'}>Push</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className='field'>
                <label className='label'>Template</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder='Template'
                    value={this.state.data.template}
                    onChange={(e) => this.handleInputChange(e, 'template')} />
                </div>
              </div>

              <div className='field'>
                <label className='label'>Descripción</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder='Descripción'
                    value={this.state.data.description}
                    onChange={(e) => this.handleInputChange(e, 'description')} />
                </div>
              </div>

              <button
                className={'button is-primary is-pulled-right' + this.state.loading}
                disabled={!!this.state.loading}
                >Guardar
              </button>
            </form>
          </section>
        </div>
      </div>
    )
  }
}

export default AlertModal
