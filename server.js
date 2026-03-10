/**
 * SERVIDOR PRINCIPAL DEL BACKEND
 * este es el archivo principal del servidor del backend
 * configura express. middlewares, ruta y conexion de base de datos
 */

//IMPORTACIONES

//Importar express para crear el servidor
const express = require('express');

//importar cors para permitir solicitudes desde el frontend
const cors = require('cors');

//importar path para manejar rutas de archivos
const path = require('path');

//importar dotenv para manejar variables de entorno
require('dotenv').config();

//importar configuracion de la base de datos
const dbConfig = require('./config/database');

//importar modelos de asociaciones
const { initAssociations } = require('./models');

//importar seeders
const { runSeeders } = require('./seeders/adminSeeder');

//crear aplicaciones express

const app = express();

//obtener el puerto desde la variable de entorno
const PORT = process.env.PORT || 5000;

//MIDDLEWARES GLOBALES

//cors permitir peticiones desde el frontend
//configura que los dominios pueden hacer peticiones al backend

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    
}))