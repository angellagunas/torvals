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

module.exports = {
  testRoles,
  datasetStatus
}
