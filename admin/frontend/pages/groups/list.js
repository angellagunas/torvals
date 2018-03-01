import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import api from '~base/api'
import tree from '~core/tree'
import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares/'
import CreateGroup from './create'
import CreateGroupNoModal from './create-no-modal'
import DeleteButton from '~base/components/base-deleteButton'
import GroupUsers from './group-users'

export default ListPage({
  path: '/manage/groups',
  title: 'Grupos',
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
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      general: {type: 'text', title: 'Buscar'}
    }
  },
  uiSchema: {
    general: {'ui:widget': 'SearchFilter'}
  },
  getColumns: () => {
    return [
      {
        'title': 'Nombre',
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
        'title': 'Organzación',
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
        'title': 'Creado',
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
        'title': 'Miembros',
        'property': 'users',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          return (
            <div>
              {row.users.length}
              {row.users.length > 0 && <GroupUsers group={row} /> }
            </div>
          )
        }
      },
      {
        'title': 'Acciones',
        'sortable': false,
        formatter: (row) => {
          const deleteObject = async function () {
            var url = '/admin/groups/' + row.uuid
            await api.del(url)

            const cursor = tree.get('groups')

            const users = await api.get('/admin/groups/',
              {
                start: 0,
                limit: 10,
                sort: cursor.sort || 'name'
              })

            tree.set('groups', {
              page: cursor.page,
              totalItems: users.total,
              items: users.data,
              pageLength: cursor.pageLength
            })
            tree.commit()
          }

          return (
            <div className='field is-grouped'>
              <div className='control'>
                <Link className='button is-primary' to={'/manage/groups/' + row.uuid}>
                  <span className='icon is-small'>
                    <i className='fa fa-pencil' />
                  </span>
                </Link>
              </div>
              <div className='control'>
                <DeleteButton
                  iconOnly
                  icon='fa fa-trash'
                  objectName='Grupo'
                  objectDelete={deleteObject}
                  message={`Está seguro de querer eliminar el grupo ${row.name} ?`}
                />
              </div>
            </div>
          )
        }
      }
    ]
  }
})
