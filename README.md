# Ballena

## Introducción

__Ballena__ es una plataforma diseñada para equipos de desarrollo que generan APIs y Aplicaciones Web basados en _Node JS_, usando _Express JS_ para generar _API REST_.

La principal característica de __Ballena__ es aislar los códigos fuente de los programadores para unificar dependencias y facilitar el despliegue de servidores.

### Filosofía

__Ballena__ sigue la filosofía de los _DevOps_ y _Kubernetes_ creando un ambiente de desarrollo continuo el cuál se pretende no sea detenido ni reiniciado para la integración de nuevos contenedores. Esto permite que el desarrollo no se detenga operativamente y el proceso de despliegue e implementación de código sea más rápido y sencillo.

__Ballena__ busca crear equipos de desarrollo ágiles, que puedan montar servidores locales y productivos de manera uniforme, para poder crear desarrollos estables y productivos mediante trabajo colaborativo automatizado.

__Ballena__ consiste en los siguientes conceptos:

1. _Contenedor_ - Es el conjunto de códigos que definen las APIs y las visas y pueden ser compartidos.
2. _Accesibilidad_ - Puede ser instalado mediante _npm install ballena_.
3. _Integración continua_ - Puede importar contenedores al servidor sin necesidad de detenerlo (sólo pausarlo programáticamente).
4. _Distribución continua_ - Permite a los equipos de desarrollo compartir contendores e integrarlos en sus ambientes locales o productivos.

### Arquitectura

La arquitectura consiste básicamente en exponer las rutas de las API y las vistas a través del registro clásico de rutas de _express_. Adicionalmente, puedes configurar un panel para administrar los módulos que serán desarrollados continuamente por el equipo, para distribuirlos, activarlos o desactivarlos.