import React, {Component} from 'react'
import BaseModal from '~base/components/base-modal'
import ChannelForm from './create-form'

var initialState = {
  name: '',
  externalId: '',
  organizations: []
}

class CreateChannel extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
    this.state = {
      organizations: []
    }
  }

  render () {
    return (
      <BaseModal
        title='Crear Canal'
        className={this.props.className}
        hideModal={this.hideModal}>
        <ChannelForm
          baseUrl='/admin/products'
          url={this.props.url}
          finishUp={this.props.finishUp}
          initialState={initialState}>
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary' type='submit'>
                Crear
              </button>
            </div>
            <div className='control'>
              <button className='button' type='button' onClick={this.hideModal}>
                Cancelar
              </button>
            </div>
          </div>
        </ChannelForm>
      </BaseModal>
    )
  }
}

export default CreateChannel
