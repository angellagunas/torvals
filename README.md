# TORVALS
Pasos para ejecutar torvals

1- Crear un ambiente virtual:
- `python3 -m venv ~/venvs/torvals`

2- Activar el ambiente:
- `source ~/venvs/torvals`


3- Instalar los requerimientos:
- `pip3 install -r backend/requirements/base.txt`

4- Crear la base de datos:
- `docker exec -it -u postgres postgres createdb torvals`
- Si no esta corriendo docker ejecutar primero:
- `docker start postgres`

5- Aplicar las migraciones
- `python backend/manage.py migrate`

6- Crear superusuario (dentro de backend):
- `python backend/manage.py createsuperuser`
- Correo electronico: `technlogies@grupoabraxas.com`
- Nombre: `tech`
- Password: `123technologies`

7- Ejecutar:
- `python backend/manage.py migrate`
