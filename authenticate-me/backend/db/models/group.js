"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.Group.belongsToMany(models.User, {
        through: "GroupMember",
        otherKey: "userId",
        foreignKey: "groupId",
        as: "members",
      });
      models.Group.hasMany(models.Image, {
        foreignKey: "groupId",
        as: "GroupImages",
      });
      models.Group.belongsTo(models.User, {
        foreignKey: "organizerId",
        as: "Organizer",
      });
    }
  }
  Group.init(
    {
      organizerId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      type: DataTypes.STRING,
      private: DataTypes.BOOLEAN,
      city: DataTypes.STRING,
      state: DataTypes.STRING,
      previewImage: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Group",
    }
  );
  return Group;
};
