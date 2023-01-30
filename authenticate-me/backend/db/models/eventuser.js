"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class EventUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.EventUser.belongsTo(models.Event, { foreignKey: "eventId" });
      models.EventUser.belongsTo(models.User, { foreignKey: "userId" });
    }
  }
  EventUser.init(
    {
      eventId: { type: DataTypes.INTEGER, references: { model: "Events" } },
      userId: { type: DataTypes.INTEGER, references: { model: "Users" } },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "EventUser",
    }
  );
  return EventUser;
};
