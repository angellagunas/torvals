import tree from '~core/tree'

function testRoles (roles) {
  if (!roles) return true
  let rolesList = roles.split(',')
  let currentRole = tree.get('role')
  let test = false

  for (var role of rolesList) {
    role = role.trim()
    if (role && currentRole && currentRole.slug === role) {
      test = true
    }
  }

  return test
}

const datasetStatus = {
  'new': 'Nuevo',
  'adjustment': 'Ajuste',
  'uploading': 'Cargando',
  'uploaded': 'Cargado',
  'preprocessing': 'Preprocesando',
  'configuring': 'Configurando',
  'processing': 'Procesando',
  'reviewing': 'Revisando',
  'ready': 'Listo',
  'conciliating': 'Conciliación',
  'conciliated': 'Conciliado',
  'pendingRows': 'Pendiente',
  'error': 'Error',
  'cloning': 'Clonando'
}

const graphColors = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#afb42b',
  '#f9a825',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#9e9e9e',
  '#607d8b'
]

const orgStatus = {
  'trial': 'Periodo de prueba',
  'active': 'Activa',
  'inactive': 'Inactiva',
  'activationPending': 'Esperando activación'
}

module.exports = {
  testRoles,
  datasetStatus,
  graphColors,
  orgStatus
}
