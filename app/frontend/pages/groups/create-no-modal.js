import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'

import GroupForm from './form'

var initialState = {
  name: '',
  description: ''
}

class CreateGroupNoModal extends Component {
  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
  }

  async load () {
    const body = await api.get(
      '/app/groups',
      {
        start: 0,
        limit: this.cursor.get('pageLength') || 10
      }
    )

    this.cursor.set({
      page: 1,
      totalItems: body.total,
      items: body.data,
      pageLength: this.cursor.get('pageLength') || 10
    })
    this.context.tree.commit()
  }

  render () {
    return (
      <GroupForm
        baseUrl='/app/groups'
        url={this.props.url}
        finishUp={this.props.finishUp}
        initialState={initialState}
        load={this.load.bind(this)}
      >
        <div className='field is-grouped is-padding-top-small'>
          <div className='control'>
            <button className='button is-primary' type='submit'>Crear</button>
          </div>
        </div>
      </GroupForm>
    )
  }
}

CreateGroupNoModal.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreateGroup = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreateGroupNoModal)

export default BranchedCreateGroup
