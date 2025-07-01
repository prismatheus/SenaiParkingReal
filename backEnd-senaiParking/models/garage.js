// models/garage.js
import database from '../database.js';
import { DataTypes } from 'sequelize';

const Garages = database.define('Garage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: { // The admin who registered the event
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    carId: { // The car involved in the event
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Cars',
            key: 'id'
        }
    },
    tipo: { // 'entrada' or 'saida'
        type: DataTypes.STRING,
        allowNull: false,
    },
    autorizado: { // Whether the event was authorized
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    timestamp: { // The time of the event
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    // Keep timestamps false if you are managing the timestamp manually
    // or set to true if you want createdAt and updatedAt fields managed by Sequelize.
    // Based on your controller, you are setting it manually, so `timestamps: false` is better.
    timestamps: false,
});

export default Garages;