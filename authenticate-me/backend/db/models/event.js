"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.Event.belongsTo(models.Group, { foreignKey: "groupId" });
      models.Event.belongsTo(models.Venue, { foreignKey: "venueId" });
    }
  }
  Event.init(
    {
      groupId: DataTypes.INTEGER,
      venueId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: DataTypes.STRING,
      type: DataTypes.STRING,
      startDate: DataTypes.STRING,
      endDate: DataTypes.STRING,
      description: DataTypes.STRING,
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Event",
    }
  );
  return Event;
};
