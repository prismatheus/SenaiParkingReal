    import database from '../database.js';
    import { DataTypes } from 'sequelize';

    const Users = database.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, 
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('admin', 'user'), // Define os tipos de usuário
            allowNull: false,
        }
    }, {
        timestamps: true, // Automaticamente adiciona createdAt e updatedAt
    });

    export default Users ;