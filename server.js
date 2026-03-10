/**
 * SERVIDOR PRINCIPAL DEL BACKEND
 * este archivo principal del backend
 * condiguracion express.middleware, rutas y conexionde la base de datos
 */

// IMPORTACIONES 

// Importar express para crear servidor 
const express = require ( 'express');

// Importar cors para permitir solisitudes desde el fronend
const cors = require ( 'cors');

// Importar path para manejar rutas de archivos
const path = require ( 'path');

// importar dotenv para manejar variables del entorno 
require ('dotenv').config();

// Importar configuracion de la base de datos 
const dbConfig = require ('./backend/config/database');

// Importar modelos y asociaciones 
const {initAssociations} = require ('./backend/models');

// Importar seeders 
const {runSeeders} = require ('./seeders/adminSeeder');
const { version } = require('os');
const { timeStamp } = require('console');

// crear aplicaciones express 

const app = express ();

// Obtener el puerto desde las variables de entorno 
const PORT = process.env.PORT || 5000;

//MIDDLEWARES GLOBALES

// cors permiten peticiones desde el fronend
//configurar que los dominios pueden hacer peticiones al backend

app.use (cors ({
    origin:process.env.FRONDEND_URL || 'http://localhost:3000', ///url del frontend
    credentials: true, // permitir enviar cookies 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], //metodos permitidos
    allowedHeaders:['Content-Type', 'Authorization'], // encabezados permitidos
}));

/**
 * express.json() - parse el body de las peticiones en fomaro JSON
 */

app.use(express.json());

/**
 * express.urlencoded() - parse el body de los formularios
 * las imagenes estaran disponibles
 */

app.use(express.urlencoded({extended: true}));

/**
 * servir archivos estaticos iamgenes desdde la capeta raiz
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//middleware para logging de peticiones
//muestra en consola cada peticion que llega el servidor

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`ok${req.method} ${req.path}`);
        next();
    });
}

//rutas

//rutas raiz verificar el servidor esta corriendo

app.get ('/', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor E-commerce backend corriendo correctamente',
        version : '1.0.0',
        timeStamp: new Date().toISOString(),
    });
});

//ruta de salud para verificar el servidor como esta
app.get ('api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        timeStamp: new Date().toISOString(),
    });
});

//rutas api

//rutas de autentiacion
//incluye registro login, perfil

const authRoutes = require ('./routes/auth.routes');
app.use('/api/auth', authRoutes);

//rutas del administrador
//requieren autenticacion y rol del administrador

const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

//rutas del cliente
const clienteRoutes = require('./routes/acliente.routes');
app.use('/api/', clienteRoutes);

// manejo de rutas no encontradas (404)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path,
    });
});

// manejo de rutas no encontradas (404)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path,
    });
});

