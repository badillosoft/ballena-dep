# @ballena/server

__Ballena__ es una plataforma diseñada para equipos de desarrollo que generan APIs y Aplicaciones Web basados en _Node JS_, usando _Express JS_ para generar _API REST_.

## Introducción
---

La principal característica de __Ballena__ es aislar los códigos fuente de los programadores para unificar dependencias y facilitar el despliegue continuo de servidores sin tener que detenerlos o exponer sus credenciales.

## Filosofía

__Ballena__ sigue la filosofía de los _DevOps_ y _Kubernetes_ creando un ambiente de desarrollo continuo el cuál se pretende no sea detenido ni reiniciado para la integración de nuevos contenedores y módulos (paquetes y librerías). Esto permite que el desarrollo no se detenga operativamente y el proceso de despliegue e implementación de código sea más rápido y sencillo.

__Ballena__ busca crear equipos de desarrollo ágiles, que puedan montar servidores locales y productivos de manera uniforme, para poder crear desarrollos estables y productivos mediante trabajo colaborativo automatizado.

__Ballena__ consiste en los siguientes conceptos:

1. _Contenedor_ - Es el conjunto de códigos que definen las APIs y las visas y pueden ser compartidos.
2. _Paquetes_ - Son los nombres de los paquetes de _Node JS_ que pueden ser instalados mediante _npm_.
3. _Librerías_ - Son módulos adaptados por los programadores, sobre los paquetes para poder simplificarlos.
4. _Accesibilidad_ - Puede ser instalado mediante _npm install @ballena/server_.
5. _Integración continua_ - Puede importar contenedores, paquetes y librerías al servidor sin necesidad de detenerlo, vía _API_ o desde el panel de administración.
6. _Distribución continua_ - Permite a los equipos de desarrollo compartirse contendores y librerías e integrarlos en sus ambientes locales o productivos.

## Arquitectura

La arquitectura consiste básicamente en exponer las rutas de las API y las vistas a través del registro clásico de rutas de _express_. Adicionalmente, puedes configurar un panel para administrar los módulos que serán desarrollados continuamente por el equipo, para distribuirlos, activarlos o desactivarlos.

## Tutorial
---

En este tutorial se mostrará el uso de _@ballena/server_.

### 1. Configurar el proyecto (ambiente)

Un proyecto para _@ballena/server_ equivale a un ambiente de desarrollo (local o productivo).

* Crea la carpeta `my-ambient` o del nombre que gustes llamarle a tu proyecto, aquí usuaremos `ambient`.

```bash
mkdir ambient
cd ambient
```

Los proyectos de servidores suelen ser un archivo de node que se ejecutan.

* Crea el archivo de entrada `index.js` o como acostumbres llamarle y usa el servidor de _ballena_ (es en realidad un servidor de express tradicional).

> `ambient/index.js`

```js
const ballena = require("@ballena/server");

const server = ballena.httpServer();

server.start();
```

* Ejecuta el servidor con `node index.js` o `node .` (pulsa `ctrl + c` para detenerlo).

```bash
node .
```

Se prenderá un servidor en `http://localhost:4000/` o puedes configurar el puerto específico con `server.start(5000)` (dónde ahora el puerto es `5000` y la url es `http://localhost:4000/`).

### 2. Crear un contenedor

Los contenedores se dividen en _APIs_ y _Vistas_. Cuándo se crean o actualizan contenedores no hay necesidad de reiniciar el servidor, a esto se le llama `Integración Containua` ya que podemos integrar y actualizar contenedores sólo reemplazando los archivos de código.

> **¡Advertencia!** lea cuidadósamente la sección correspondiente al `Modo Productivo: Seguridad y Optimización`.

Una `API` es un archivo de _javascript_ que devuelve una respuesta JSON. Estas son llamadas de la forma `http://localhost:4000/<container-name>/api/<api-name>`, dónde `<container-name>` es el nombre del contenedor y `<api-name>` es el nombre del _api_.

* Crea el contendor llamado `todo`. Para esto crea las carpetas `todo`, `todo/api` y `todo/view` desde la carpeta principal. Dentro de la carpeta `todo/api` coloca un archivo llamado `index.js`.

> `ambient/todo/api/index.js`

```js
return "Hello TODO api";
```

Ve a la ruta `http://localhost:4000/todo/api`. Deberías obtener una respuesta similar a la siguiente.

```json
{
    "ballena": "v1.0",
    "container": "todo",
    "api": "index",
    "exists": true,
    "error": null,
    "result": "Hello TODO api",
    "logs": []
}
```

* Crea una vista colocando un archivo `index.html` dentro de la carpeta `todo/view`, todos los códigos puestos aquí serán públicos, incluyendo las subcarpetas. Esto funciona al estilo `public_html` o `www_root` de otros tipos de servidores. Aquí se propone una estructura `view/index.html`, `view/cdn/css/style.css`, `view/cdn/js/app.js`, etc.

> `ambient/todo/view/index.html`

```html
<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>TODO App</title>

</head>

<body>

    <h1>Hello TODO view</h1>

</body>

</html>
```

Ve a la ruta `http://localhost:4000/todo`. Deberías obtener una respuesta similar a la siguiente.

```text
Hello TODO view
```

Ahora ya está configurado tu primer contenedor, agrega funcionalidad extra para ver el potencial de `@ballena/server`.

> `ambient/todo/api/add.js`

```js
const title = input("title");

container.todos = container.todos || [];

const todo = {
    id: container.todos.length + 1,
    title,
    checked: false,
    createAt: new Date()
};

container.todos.push(todo);

return todo;
```

> `ambient/todo/api/check.js`

```js
const id = input("id");

container.todos = container.todos || [];

const todo = container.todos.find(todo => todo.id === id);

if (!todo) throw new Error(`Invalid TODO with id ${id}`);

todo.checked = true;

return todo;
```

> `ambient/todo/api/delete.js`

```js
const id = input("id");

container.todos = container.todos || [];

const todo = container.todos.find(todo => todo.id === id);

if (!todo) throw new Error(`Invalid TODO with id ${id}`);

container.todos = container.todos.filter(todo => todo.id !== id);

return todo;
```

> `ambient/todo/api/all.js`

```js
return container.todos || [];
```

```html
<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>TODO App</title>

</head>

<body>

    <h1>Hello TODO view</h1>

</body>

</html>
```