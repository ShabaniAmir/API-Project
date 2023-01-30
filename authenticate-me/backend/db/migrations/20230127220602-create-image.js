"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Images", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      url: {
        type: Sequelize.STRING,
      },
      preview: {
        type: Sequelize.BOOLEAN,
      },
      groupId: {
        type: Sequelize.INTEGER,
        references: { model: "Groups" },
      },
      eventId: {
        type: Sequelize.INTEGER,
        references: { model: "Events" },
        allowNull: true,
      },
      venueId: {
        type: Sequelize.INTEGER,
        references: { model: "Venues" },
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Images");
  },
};
