// const { DataTypes } = require('sequelize');
// const bcrypt = require('bcrypt');

// module.exports = (sequelize) => {
//   const User = sequelize.define('User', {
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false
//     },
//     email: {
//       type: DataTypes.STRING,
//       unique: true,
//       allowNull: false,
//       validate: { isEmail: true }
//     },
//     password: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       set(value) {
//         // Hash and salt the password before storing
//         const hash = bcrypt.hashSync(value, 8);
//         this.setDataValue('password', hash);
//       }
//     },
//     admin: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false
//     }
//   });

//   return User;
// };