import React, { Component } from 'react'
import PropTypes from 'prop-types'

import BaseModal from '~base/components/base-modal'

class DeleteButton extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.hideModal.bind(this)
    this.yesOnClick = this.yesOnClick.bind(this)
    this.state = {
      className: '',
      isLoading: ''
    }
  }

  showModal () {
    this.setState({
      className: ' is-active'
    })
  }

  hideModal () {
    this.setState({
      className: '',
      isLoading: ''
    })
  }

  async yesOnClick () {
    this.setState({isLoading: ' is-loading'})
    await this.props.objectDelete()
    this.hideModal()
  }

  onlyIcon () {
    if (!this.props.iconOnly) {
      return (
        <span>
          {this.props.titleButton || 'Eliminar'}
        </span>
      )
    }
  }

  render () {
    let footer = (
      <div className='buttons'>

        <button className='button is-info' onClick={this.hideModal}>Cancelar</button>
        <button
          className={'button is-danger' + this.state.isLoading}
          disabled={!!this.state.isLoading}
          type='button'
          onClick={this.yesOnClick}
        >
          {this.props.iconOnly ? 'Eliminar' : this.props.titleButton || 'Eliminar'}
        </button>
      </div>
    )

    if (this.props.small) {
      return (
        <div className='delete-button'>
          <button className='delete is-small'
            onClick={() => this.showModal()} />
          <BaseModal
            title={(this.props.titleButton || 'Eliminar') + ' ' + (this.props.objectName || 'Objeto')}
            className={this.state.className}
            hideModal={this.hideModal}>
            <h3>
              {this.props.message || '¿Estas seguro de querer eliminar este objeto?'}
            </h3>
            <div className='is-pulled-right'>{footer}</div>
          </BaseModal>
        </div>
      )
    }

    return (
      <div className='delete-button'>
        <button
          className='button is-danger'
          type='button'
          onClick={() => this.showModal()}
        >
          {this.onlyIcon()}
          {!this.props.hideIcon &&
          <span className='icon '>
            <i className={this.props.icon || 'fa fa-trash'} />
          </span>
          }
        </button>
        <BaseModal
          title={(this.props.titleButton || 'Eliminar') + ' ' + (this.props.objectName || 'Objeto')}
          className={this.state.className}
          hideModal={this.hideModal}

        >
          <h3>
            {this.props.message || '¿Estas seguro de querer eliminar este objeto?'}
          </h3>
          <div className='is-pulled-right'>{footer}</div>
        </BaseModal>
      </div>
    )
  }
}

DeleteButton.proptypes = {
  objectDelete: PropTypes.func.isRequired,
  titleButton: PropTypes.string,
  objectName: PropTypes.string,
  message: PropTypes.string,
  history: PropTypes.object.isRequired
}

export default DeleteButton
