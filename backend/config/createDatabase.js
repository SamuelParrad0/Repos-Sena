/**
 * Script de inializacion de la base de datos
 * este Script crea la base de datos si no existe
 * Debe ejecutarde una sola vez antes de iniciar el servidor
 */

//Importa mysql2 para la conexion directa 
const mysql = require('mysql2/promise');

//Importar dotenv para cargar las variables de entorno
require('dotenv').config();

// Funcion para crear la base de datos 
const createDatabase = async () => {
    let connection;

    try {
        console.log('Iniciando creacion de la base de datos ...\n');

        //Conectar a MySQL sin especificar base de datos con variables de .env
        console.log(' Conectando a MySQL ...');
        connection = await mysql.createDatabase({
            host: process.env.DB_HOST || 'Localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log(' Conexion a MySQL establecida\n');

        // Crear la base de datos si no existe
        const dbName = process.env.DB_NAME || 'ecommerce'; //obtiene nombre base de datos
        console.log(`Creado base de datos: ${dbName}...`); //si no llega a existir, la crea

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`'${dbName}' creada/verrificada exitosamente\n`); //el query genera la conexion, al generarla le envia el mensaje de que no existe, y luego la crea

        //Cerrar conexion
        await connection.end();//termina la conexion

        console.log(' ¡Proceso completado! Ahora puedes iniciar el servidor con: npm start\n');//los console.log son mensajes que solo aparecen en la consola
    } catch (error) { //el catch error, es cuando si alguna parte el try llega a ver error, botara estos mensajes
        console.error('Error al crear la base de datos:', error.message);
        console.error('\n verificada que: ');
        console.error('1. XAMPP esta corriendo\n');
        console.error('2. MySQL esta iniciando en XAMPP');
        console.error('3. Las credenciales en .env sean correctas');

        if (connection) { //si la conexion llega a tener un error, pero esta abierta, la cierra con el .end
            await connection.end();
        }

        process.exit(1);
    }
};

// Ejecutar la funcion
createDatabase();