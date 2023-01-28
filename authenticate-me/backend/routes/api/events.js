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
// GET /api/groups/:groupId/events/
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

// Get a single event
// GET /api/groups/:groupId/events/:eventId
router.get("/:eventId", async (req, res, next) => {
  const { eventId, groupId } = req.params;
  if (!eventId) {
    const err = new Error("Event ID is required");
    err.status = 400;
    err.title = "Event ID is required";
    err.errors = ["Event ID is required"];
    return next(err);
  }
  const event = await Event.findByPk(eventId, {
    include: [
      {
        model: Venue,
      },
      {
        model: Group,
      },
    ],
  });

  return res.json(event);
});

module.exports = router;
