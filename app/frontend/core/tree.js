import Baobab from 'baobab'

import cookies from '~base/cookies'

const initialState = {
  jwt: cookies.get('jwt')
}

const tree = new Baobab(initialState, {
  autoCommit: false,
  asynchronous: true,
  immutable: true
})

window.tree = tree

export default tree
