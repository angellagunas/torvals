# TORVALS
Pasos para ejecutar torvals

1- Crear un ambiente virtual:
- `python3 -m venv ~/venvs/torvals`

2- Activar el ambiente:
- `source ~/venvs/torvals/bin/activate`


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

**************************************************************
Pasos para cargar información 

Desde el Admin:

1- Si es para un nuevo proyecto, crear el Proyecto en Project

2- En Batch, añadir dos:
	- Uno de tipo productos (Type:productos)
	- Otro de tipo centros de ventas (Type: sales_centers)


3- Mapear el Dataset:
- En Project asociar las columnas que vienen en el dataset que se va a cargar con las que se necesitan en el proyecto

3- En Datasets, añadir el dataset

4- Asignar al usuario el o los centros de ventas

