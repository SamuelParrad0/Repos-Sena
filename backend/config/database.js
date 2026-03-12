/**CONFIGURACION DE LA BASE DE DATOS */

// Importar la clase Sequelize correctamente. Anteriormente se intentaba
// desestructurar `{ sequelize }` de la exportación del paquete, lo cual
// devuelve `undefined` y provoca el error MODULE_NOT_FOUND visto en
// server.js:10 cuando se intentaba usar la variable.
const { Sequelize } = require('sequelize'); //clase usada para instanciar la conexión

//Importar dotenv para variables de entorno
require('dotenv').config(); //llama directamente las variables de entorno

//  Crear instancias de sequelize
const sequelize = new Sequelize( //el .env son las conexiones de las variables de entorno
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST, //
        port: process.env.DB_PORT,
        dialect: 'mysql',
        
        //Configuracion de pool de conexiones
        //mantiene las conexiones abiertas para mejorar el rendimiento 
        pool: {
            max: 5,
            min: 0,
            acquire: 30000, //tiempo en milisegundos para conectarse exitosamente
            idle: 10000 //tiempo maximo para que el programam se quede quieto
        },
        //Configuracion del logging
        //permite ver las consultas de mysql por consola
        logging: process.env.NODE_ENV ===
        'development' ? console.log : false,

        //Zone horaria
        timezone: '-05:00', //Zona horaria de colombia

        //Opciones adicionales
        define: { //- son las opciones que van a aplicar en todos los modelos por defecto
            //timestamps: true crea automaticamente los campos createdAt y updateAt
            timestamps: true, //- crea los campos automaticamente los campos de crear y actualizar

            //Underscored: true una snake_case para nombres de las columnas
            underscored: false,

            //freezeTableName: true usa el nombre del modelo tal cual para la tabla
            freezeTableName: true //- usa el nombre exacto del modelo para las tablas

        }

    }
);

/** Funcion para probar la conexion de la base de datos
 * esta funcion se llamara al iniciar el servidor 
 */
const testConnection = async () => {
    try {
        //Intentar autenticar con la base de datos
        await sequelize.authenticate();
        console.log('Conexion a MySql establecida correctamente');
        return true;

    } catch (error) {
        console.error('Error al conectar a MySQL:', error.message);
        console.error('Verifica que XAMPP este corrigiendo y las credenciales en .env sean correctas');
    return false;
    }
}

/*
//** Funcion para sincronizar los modelos con la base de datos
// * Esta funcion creara las tablas automaticamente basandose en los modelos
* @param {bolean} force - si es true, elimina y recrea todas las tablas
* @param {bolean} alter - si es true, modifica las tablas existentes para qeue coincidan con los modelos
*/

//syncDatabase: esta para comparar directamente con los modelos y con la base de datos
const syncDatabase = async (force = false, alter = false) => {
    try {
        //Sincronizar todos los modelos con la base de datos
        await sequelize.sync({force, alter}); //forza a modificar tal cual como esta el modelo, alter 
        
        if (force) {
            console.log('Base de datos sincronizada (todas las tablas recreadas).');
        } else if (alter) {
            console.log('Base de datos sincronizada (tablas alteradas segun los modelos).');
        } else {
            console.log('Base de datos sincronizada correctamente.');
        }

        return true; //todo paso exitosamente y no paso nada
    } catch (error) {
        console.error('X Error al sincronizar la base de datos:', error.message);
        return false;
    }
};
// Exportar la instancia de sequelize y las funciones 
module.exports = {
    sequelize,
    testConnection,
    syncDatabase
}; 