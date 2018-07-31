import React, { Component } from 'react'
import moment from 'moment'
import Spinner from '~base/components/spinner'
import PropTypes from 'prop-types'

import api from '~base/api'

function Note ({ note, onClick }) {
  if (note.isDeleted) {
    return null
  }
  return (
    <div className='note' style={{
      'marginTop': '10px',
      background: '#ecf0f1',
      padding: '2px',
      'borderRadius': '4px'
    }}>
      <div className='note-header'>
        <p><strong>{note.user.name}</strong></p>
        <p style={{textAlign: 'right'}}>
          <strong>{moment(note.dateCreated).format('MM/DD/YYYY')}</strong>
          <br />
          <i className='fa fa-times' style={{cursor: 'pointer'}} onClick={onClick} />
        </p>
      </div>
      <div className='note-body'>
        {note.text}
      </div>
    </div>
  )
}

Note.propTypes = {
  note: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired
}

class ListNote extends Component {
  constructor (props) {
    super(props)
    this.state = {
      notes: [],
      text: '',
      loading: false,
      fail: null,
      loadingSave: false,
      failSave: null
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.refresh) {
      this.load()
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    this.setState({ loading: true })

    var url = `/admin/organizations/${this.props.uuid}/notes`
    try {
      const body = await api.get(url)
      this.setState({
        loading: false,
        notes: body.reverse(),
        fail: null
      })
    } catch (err) {
      this.setState({
        loading: false,
        fail: err
      })
    }
  }

  async removeItem (note, e) {
    e && e.preventDefault()
    const body = await api.post(`/admin/organizations/${note.organization.uuid}/notes/${note.uuid}`)
    this.load()
  }

  render () {
    const { notes, loading, text, fail, loadingSave } = this.state
    return (
      <div>
        <div className='notes'>
          {
            loading
              ? <Spinner />
              : notes.map((note, key) => <Note onClick={this.removeItem.bind(this, note)} key={key} note={note} />)
          }
          {!!fail && <p style={{color: 'gray', textAlign: 'center'}}>¡Error: {fail.message}!</p>}
        </div>
      </div>
    )
  }
}

ListNote.propTypes = {
  uuid: PropTypes.string.isRequired
}

export default ListNote
