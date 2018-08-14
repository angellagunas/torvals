import React, { Component } from 'react'
import ImportCSV from './import-csv'
import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import tree from '~core/tree'

class ImportGroups extends Component {
  constructor (props) {
    super(props)
    this.rules = tree.get('rule')
  }

  getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min)) + min
  }

  getExample () {
    let str = '"name","users",'
    for (let a of this.rules.catalogs) {
      if (a.slug === 'producto') continue
      str += `"${a.slug}-externalId",`
    }
    str = str.substring(0, str.length - 1)

    str += '\n\r"Grupo 1","email@email.com",'
    for (let a of this.rules.catalogs) {
      if (a.slug === 'producto') continue
      str += `"${this.getRandomInt(1000, 9999)}",`
    }
    str = str.substring(0, str.length - 1)

    str += '\n\r"Grupo 2","email1@email.com, email2@email.com",'
    for (let a of this.rules.catalogs) {
      if (a.slug === 'producto') continue
      str += `"${this.getRandomInt(1000, 9999)},${this.getRandomInt(1000, 9999)},${this.getRandomInt(1000, 9999)}",`
    }
    str = str.substring(0, str.length - 1)

    str += '\n\r"Grupo 3","",'
    let done = false
    for (var i = 0; i < this.rules.catalogs.length; i++) {
      if (this.rules.catalogs[i].slug === 'producto') continue

      if (done) {
        str += '"",'
      } else {
        str += `"${this.getRandomInt(1000, 9999)},${this.getRandomInt(1000, 9999)},${this.getRandomInt(1000, 9999)}",`
      }

      done = true
    }
    str = str.substring(0, str.length - 1)
    return str
  }

  render () {
    let example = this.getExample()

    return (
      <ImportCSV
        url='/app/groups/import/'
        title='grupos'
        format={
          <pre style={{ marginTop: '1em' }}>
            {example}
          </pre>
        }
      />
    )
  }
}

export default Page({
  path: '/import/groups',
  title: 'Grupos',
  icon: 'users',
  exact: true,
  validate: [loggedIn, verifyRole],
  roles: 'orgadmin, manager-level-3',
  component: ImportGroups
})
