module.exports = (sequelize, DataTypes) => {
    const AdminUser = sequelize.define("AdminUser", {
        secretCode: {
            type: DataTypes.STRING,
            allowNull: false
        },
        adminID: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
    return AdminUser;
}