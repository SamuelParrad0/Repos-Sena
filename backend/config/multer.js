/**
 * Cofiguracion de subida de archivos
 * 
 * Multer es un middleware para manejar la subida de archivos
 * Este archivo configura como y donde se guardan las imagenes 
 */

//importar multer para manejar archivos 
const multer = require('multer');

//Importar path para trabajar con rutas de archivos
const path = require('path');//le crea directamente la ruta a los archivos

//Importar fs para verificar /crear directorios
const fs = require('fs'); //es el modulo nativo que permite leer, escribir, eliminar y modificar archivos y carpetas

//Importar dotenv para variables de entorno
require('dotenv').config(); //importa todas las conexiones con las variables de entorno

//Obtener la ruta donde se guardan los archivos 
const uploadPath = process.env.UPLOAD_PATH || './uploads'; //verifica y compara que la carpeta destinatoria sea la misma del .env

//Verificar si la carpeta uploads existe, si no crearla
if (!fs.existsSync(uploadPath)) { //si no esta la carpeta, la crea
    fs.mkdirSync(uploadPath, {recursive: true}); //mkdir es para que cree archivos
    console.log(`Carpeta ${uploadPath} creada`); //la carpeta fue creada
}

/**
 * Configuracion de almacenamiento de multer 
 * Define donde y como se guardaran los archivos
 */

const storage = multer.diskStorage({
  /**
   * Destination: define la carpeta destino donde se guardara el archivo
   * 
   * @param {Object} req - Objeto de peticion HTTP
   * @param {Object} file - Archivo que esta subiendo
   * @param {Function} cb . Callback que se llama con (error, destination)
   */  
   destination: function (req, file, cb) { //- busca la ruta directamente donde va a crear la ruta o el archivo 
    //cb(null, ruta) -> sin error, ruta = carpeta destino
    cb(null, uploadPath);
   },

/**
 * filename: Define el nombre con el que se guardara el archivo
 * formato: timestamp-nombreoriginal.ext
 * 
 * @param {Object} req - Objeto de peticion HTTP
 * @param {Object} file - Archivo que se esta subiendo 
 * @param {Function} cb - Callback que se llama con (error, filename)
 */
filename: function (req, file, cb) { //crea el nombre del archivo
    //Generar nombre unico usando timestamp + nombre original
    //Date.now() genera un timestamp unico
    //path.extname() extrae la extension del archivo (.jpg, .png, etc)
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
}
});

/**
 * Filtro para validar el tipo de archivo
 * Solo permite imagenes (jpg, jpeg, png, gif)
 * 
 * @param {Object} req - Objeto de peticion HTTP
 * @param {Object} file - Archivo que se esta subiendo
 * @param {Function} cb - Callback que se llama con (error, acceptFile)
 */
const filefilter = (req, file, cb) => { //verifica si permite los parametros pre establecidos de guardado
    //Tipos Mime permitidos para imagenes
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    //Verificar si el tipo de archivo esta en la lista permitida

    if (allowedMimeTypes.includes(file.mime)) {
        //cb(null, true) -> aceptar el archivo
        cb(null, true);
    } else {
        //cb(error) -> rechazer archivo
        cb(new Error('solo se permite imagenes (JPG, JPEG, PNG, GIF)'), false);
    }
};

/**
 * Configurar multer con las opciones definidas
 */

const upload = multer ({
    storage : storage,
    filefilter: filefilter,
    limits: {
        //Limite de tamaño de archivoen bytes
        //por defecto 5MB (5 * 1024) 5242880 bytes
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
    }
});

/**
 * Funcion para eliminar el archivo del servidor
 * Util cuando se actualiza o elimina un producto
 * 
 * @param {String} filename - nombre del archivo a eliminar
 * @returns {Boolean} - true si se elimino, false si hubo un error
 */

const deletefile = (filename) => { //consulta la ruta directamente del archivo para eliminarlo
    try {
        //Construir la ruta completa del archivo
        const filePath = path.join(uploadPath, filename);

        //verificar si el archivo existe
        if (fs.existsSync(filePath)) {
            //Eliminar el archivo
            fs.unlinkSync(filePath);
            console.log(`Archivo eliminado: ${filename}`)
            return true;
        } else {
            console.log(`Archivo no encontrado: ${filename}`);
            return false;
        }
    } catch (error) {
        console.error('Error al eliminar archivo:', error.message);
        return false;
    }
};

//Exportar configuracion del multer y funcion de eliminacion
module.exports = {
    upload,
    deletefile
};