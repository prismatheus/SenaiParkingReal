// models/car.js
import database from '../database.js'; // Assumindo que você tem um arquivo database.js para sua instância Sequelize
import { DataTypes } from 'sequelize';
import Users from './user.js'; // Importe o modelo de Usuário

const Cars = database.define('Car', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    manufacturer: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    plate: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    color: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // *** ESTA É A DEFINIÇÃO DA CHAVE ESTRANGEIRA userId NO MODELO CAR ***
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Users, // Referencia a tabela 'Users'
            key: 'id',     // Referencia a coluna 'id' da tabela 'Users'
        },
        // *** ESTA É A LINHA MAIS IMPORTANTE: Adicione ou confirme ESTA PROPRIEDADE ***
        onDelete: 'CASCADE', // Automaticamente deleta carros quando o usuário é deletado
    },
}, {
    timestamps: true,
});

// *** É CRUCIAL DEFINIR AS ASSOCIAÇÕES TAMBÉM COM onDelete: 'CASCADE' ***
// Se você tem um arquivo de associações separado, defina-as lá.
// Se não, pode definir aqui APÓS a definição de AMBOS os modelos (Users e Cars):

// Um Usuário tem muitos Carros
Users.hasMany(Cars, { foreignKey: 'userId', as: 'cars', onDelete: 'CASCADE' });

// Um Carro pertence a um Usuário
Cars.belongsTo(Users, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });


export default Cars;
