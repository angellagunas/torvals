import React, {Component} from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'

import BaseModal from '~base/components/base-modal'
import ChannelForm from './create-form'

var initialState = {
  name: '',
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

  componentWillMount () {
    //this.cursor = this.context.tree.select(this.props.branchName)
  }
  render () {
    return (
      <BaseModal
        title='CreateProduct'
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
                Create
              </button>
            </div>
            <div className='control'>
              <button className='button' type='button' onClick={this.hideModal}>
                Cancel
              </button>
            </div>
          </div>
        </ChannelForm>
      </BaseModal>
    )
  }
}

export default CreateChannel
