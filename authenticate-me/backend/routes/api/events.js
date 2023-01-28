const express = require("express");
const router = express.Router({
  mergeParams: true,
});
const { Event, Venue, Group } = require("../../db/models");
const { handleValidationErrors } = require("../utils");
const { check } = require("express-validator");
const { requireAuth } = require("../../auth");

// Get is handled in index.js

// Get all events of a group
router.get("/", async (req, res, next) => {
  const { groupId } = req.params;
  const events = await Event.findAll({
    include: [
      {
        model: Venue,
      },
      {
        model: Group,
      },
    ],
    where: {
      groupId,
    },
  });

  return res.json(events);
});

module.exports = router;
