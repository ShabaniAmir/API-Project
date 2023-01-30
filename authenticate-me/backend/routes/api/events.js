const express = require("express");
const router = express.Router({
  mergeParams: true,
});
const {
  Event,
  Venue,
  Group,
  GroupMember,
  EventUser,
} = require("../../db/models");
const { handleValidationErrors } = require("../../utils/validation");

const { check } = require("express-validator");
const { requireAuth } = require("../../utils/auth");

// Get is handled in index.js

// Get all events of a group
// GET /api/groups/:groupId/events/
router.get("/", async (req, res, next) => {
  const { groupId } = req.params;
  if (!groupId) {
    const err = new Error("Group ID is required");
    err.status = 400;
    err.title = "Group ID is required";
    err.errors = ["Group ID is required"];
    return next(err);
  }
  const events = await Event.findAll({
    where: {
      groupId,
    },
    include: [
      {
        model: Venue,
      },
      {
        model: Group,
      },
    ],
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

// Create an event
// POST /api/groups/:groupId/events/
const validateEvent = [
  check("name")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for name"),
  check("type")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for type"),
  check("capacity")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for capacity"),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for description"),
  check("startDate")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for startDate"),
  check("endDate")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for endDate"),
  check("price")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for price"),

  handleValidationErrors,
];

// Add an Image to a Event based on the Event's id
// POST /api/groups/:groupId/events/:eventId/images
const validateImage = [
  check("url")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for url"),
  check("preview")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for preview"),
  handleValidationErrors,
];
router.post("/:eventId/images", validateImage, async (req, res, next) => {
  const { eventId, groupId } = req.params;
  const { url, preview } = req.body;

  const event = await Event.findByPk(eventId);
  if (!event) {
    const err = new Error("Event not found");
    err.status = 404;
    err.title = "Event not found";
    err.errors = ["Event not found"];
    return next(err);
  }
  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.status = 404;
    err.title = "Group not found";
    err.errors = ["Group not found"];
    return next(err);
  }
  // Authorization
  const groupMember = await GroupMember.findOne({
    where: {
      userId: req.user.id,
      groupId: event.groupId,
    },
  });
  if (!groupMember) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.title = "Unauthorized";
    err.errors = ["Unauthorized"];
    return next(err);
  }

  const image = await Image.create({
    url,
    preview,
    eventId,
    groupId,
  });

  return res.json(image);
});

router.post("/", [requireAuth, validateEvent], async (req, res, next) => {
  const { groupId } = req.params;
  if (!groupId) {
    const err = new Error("Group ID is required");
    err.statusCode = 400;
    err.title = "Group ID is required";
    err.errors = ["Group ID is required"];
    return next(err);
  }
  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    err.title = "Group not found";
    err.errors = ["Group not found"];
    return next(err);
  }

  // Authorization
  const groupMember = await GroupMember.findOne({
    where: {
      userId: req.user.id,
      groupId,
    },
  });

  const { role } = groupMember;
  if (!["organizer", "co-host"].includes(role)) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    err.title = "Unauthorized";
    err.errors = ["Unauthorized"];
    return next(err);
  }

  const {
    name,
    type,
    capacity,
    description,
    startDate,
    endDate,
    price,
    venueId,
  } = req.body;

  const event = await Event.create({
    name,
    type,
    capacity,
    description,
    startDate,
    endDate,
    price,
    groupId,
    venueId,
  });
  return res.json(event);
});

module.exports = router;
