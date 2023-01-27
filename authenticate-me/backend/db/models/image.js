"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.Image.belongsTo(models.Group, {
        foreignKey: "groupId",
        as: "GroupImages",
      });
    }
  }
  Image.init(
    {
      url: DataTypes.STRING,
      preview: DataTypes.BOOLEAN,
      groupId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Image",
    }
  );
  return Image;
};
