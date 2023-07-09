module.exports = (sequelize, DataTypes) => {
    const Account = sequelize.define("Account", {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phoneNo: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userType: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
    return Account;
}