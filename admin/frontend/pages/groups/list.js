import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares/'
import CreateGroup from './create'
import CreateGroupNoModal from './create-no-modal'

export default ListPage({
  path: '/manage/groups',
  title: 'Groups',
  icon: 'users',
  exact: true,
  validate: loggedIn,
  titleSingular: 'Grupo',
  create: false,
  createComponent: CreateGroup,
  sidePanel: true,
  sidePanelIcon: 'plus',
  sidePanelComponent: CreateGroupNoModal,
  baseUrl: '/admin/groups',
  branchName: 'groups',
  detailUrl: '/admin/manage/groups/',
  getColumns: () => {
    return [
      {
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/manage/groups/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Organzation',
        'property': 'organization',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/manage/organizations/' + row.organization.uuid}>
              {row.organization.name}
            </Link>
          )
        }
      },
      {
        'title': 'Created',
        'property': 'dateCreated',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateCreated).local().format('DD/MM/YYYY hh:mm a')
          )
        }
      },
      {
        'title': 'Actions',
        'sortable': false,
        formatter: (row) => {
          return <Link className='button' to={'/manage/groups/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
