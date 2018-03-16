import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import api from '~base/api'
import tree from '~core/tree'
import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateGroup from './create'
import CreateGroupNoModal from './create-no-modal'
import DeleteButton from '~base/components/base-deleteButton'
import GroupUsers from './group-users'

export default ListPage({
  path: '/manage/groups',
  title: 'Grupos',
  icon: 'users',
  exact: true,
  roles: 'admin, orgadmin, analyst, manager-level-3, manager-level-2',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Grupo',
  create: false,
  createComponent: CreateGroup,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Dashboard',
        current: false
      },
      {
        path: '/manage/groups/',
        label: 'Grupos',
        current: true
      }
    ],
    align: 'left'
  },
  sidePanel: true,
  sidePanelIcon: 'plus',
  sidePanelComponent: CreateGroupNoModal,
  baseUrl: '/app/groups',
  branchName: 'groups',
  detailUrl: '/manage/groups/',
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
        formatter: (row) => {
          const deleteObject = async function () {
            var url = '/app/groups/' + row.uuid
            await api.del(url)

            const cursor = tree.get('groups')
            const users = await api.get('/app/groups/')

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
                  <span className='icon is-small' title='Editar'>
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
