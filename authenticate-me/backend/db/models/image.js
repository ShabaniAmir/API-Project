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
      models.Image.belongsTo(models.Event, {
        foreignKey: "eventId",
        as: "EventImages",
      });
      models.Image.belongsTo(models.Venue, {
        foreignKey: "venueId",
        as: "VenueImages",
      });
    }
  }
  Image.init(
    {
      url: DataTypes.STRING,
      preview: DataTypes.BOOLEAN,
      groupId: DataTypes.INTEGER,
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      venueId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Image",
    }
  );
  return Image;
};
