/**
 * MODELO CATEGORIA
 * 
 *Define ña tabla Categoria en la base de datos 
 Almacena las cetogorias principales de los productos
 */

 //Importar DataTypes de sequelize
 const { DataTypes} = require('sequelize');

 //Importar instancia de sequelize
 const { sequelize } = require('../config/database');

 /**
  * Definir el modelo de Categoria
  */
 const Categoria = sequelize.define('Categoria', {
    //Campos de la tabla
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
 })