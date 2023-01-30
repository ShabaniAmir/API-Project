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
    err.message = "Group ID is required";

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
    err.message = "Event ID is required";

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
    err.message = "Event not found";

    return next(err);
  }
  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.status = 404;
    err.message = "Group not found";

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
    err.message = "Unauthorized";

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

// Edit an event based on the event's id
// PUT /api/groups/:groupId/events/:eventId
router.put("/:eventId", validateEvent, async (req, res, next) => {
  const { eventId, groupId } = req.params;
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

  const event = await Event.findByPk(eventId);
  if (!event) {
    const err = new Error("Event not found");
    err.status = 404;
    err.message = "Event not found";

    return next(err);
  }

  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.status = 404;
    err.message = "Group not found";

    return next(err);
  }

  // Authorization
  const groupMember = await GroupMember.findOne({
    where: {
      userId: req.user.id,
      groupId: event.groupId,
    },
  });
  if (!["organizer", "co-host"].includes(groupMember.role)) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.message = "Unauthorized";

    return next(err);
  }

  await event.update({
    name,
    type,
    capacity,
    description,
    startDate,
    endDate,
    price,
    venueId,
  });

  return res.json(event);
});

// Delete an event based on the event's id
// DELETE /api/groups/:groupId/events/:eventId
router.delete("/:eventId", async (req, res, next) => {
  const { eventId, groupId } = req.params;

  const event = await Event.findByPk(eventId);
  if (!event) {
    const err = new Error("Event not found");
    err.status = 404;
    err.message = "Event not found";

    return next(err);
  }

  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.status = 404;
    err.message = "Group not found";

    return next(err);
  }

  // Authorization
  const groupMember = await GroupMember.findOne({
    where: {
      userId: req.user.id,
      groupId: event.groupId,
    },
  });
  if (!["organizer", "co-host"].includes(groupMember.role)) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.message = "Unauthorized";

    return next(err);
  }

  await event.destroy();

  return res.json({
    message: "Successfully deleted",
  });
});

router.post("/", [requireAuth, validateEvent], async (req, res, next) => {
  const { groupId } = req.params;
  if (!groupId) {
    const err = new Error("Group ID is required");
    err.statusCode = 400;
    err.message = "Group ID is required";

    return next(err);
  }
  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    err.message = "Group not found";

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
    err.message = "Unauthorized";

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

// Get all attendees of an event based on the event's id
// GET /api/groups/:groupId/events/:eventId/attendees
router.get("/:eventId/attendees", async (req, res, next) => {
  const { eventId, groupId } = req.params;
  const { id: userId } = req.user;

  // Get role of user
  const groupMember = await GroupMember.findOne({
    where: {
      userId,
      groupId,
    },
  });
  if (!groupMember) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.message = "Unauthorized";
  }

  const event = await Event.findByPk(eventId);
  if (!event) {
    const err = new Error("Event not found");
    err.status = 404;
    err.message = "Event not found";

    return next(err);
  }

  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.status = 404;
    err.message = "Group not found";

    return next(err);
  }

  if (!["organizer", "co-host"].includes(groupMember.role)) {
    const attendees = await EventUser.findAll({
      where: {
        eventId,
      },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });
  } else {
    // All but pending
    const attendees = await EventUser.findAll({
      where: {
        [Op.and]: [{ eventId }, { status: { [Op.ne]: "pending" } }],
      },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });
  }

  return res.json(attendees);
});

// Request to attend an event based on the events id
// POST /api/groups/:groupId/events/:eventId/attendees
router.post("/:eventId/attendees", async (req, res, next) => {
  const { eventId, groupId } = req.params;
  const { id: userId } = req.user;

  const event = await Event.findByPk(eventId);
  if (!event) {
    const err = new Error("Event not found");
    err.status = 404;
    err.message = "Event not found";

    return next(err);
  }

  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.status = 404;
    err.message = "Group not found";

    return next(err);
  }

  // Authorization
  const groupMember = await GroupMember.findOne({
    where: {
      userId,
      groupId,
    },
  });
  if (!groupMember) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.message = "Unauthorized";

    return next(err);
  }

  const eventUser = await EventUser.findOne({
    where: {
      userId,
      eventId,
    },
  });
  if (eventUser && eventUser.status === "pending") {
    return res.status(400).json({
      message: "Attendance has already been requested",
      statusCode: 400,
    });
  } else if (eventUser && eventUser.status === "accepted") {
    return res.status(400).json({
      message: "User is already an attendee of the event",
      statusCode: 400,
    });
  }

  const newEventUser = await EventUser.create({
    userId,
    eventId,
    status: "pending",
  });

  return res.json(newEventUser);
});

// Change the status of an attendance for an event specified by id
// PUT /api/groups/:groupId/events/:eventId/attendees
router.put(
  "/:eventId/attendees",
  [
    check("userId")
      .exists({ checkFalsy: true })
      .withMessage("Please provide a value for userId"),
    check("status")
      .exists({ checkFalsy: true })
      .withMessage("Please provide a value for status"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    const { eventId, groupId } = req.params;
    const { id: userId } = req.user;
    const { userId: attendeeId, status } = req.body;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        message: "Event couldn't be found",
        statusCode: 404,
      });
    }

    if (status === "pending") {
      return res.status(400).json({
        message: "Cannot change an attendance status to pending",
        statusCode: 400,
      });
    }

    const attendance = await EventUser.findOne({
      where: {
        eventId,
        userId: attendeeId,
      },
    });
    if (!attendance) {
      return res.status(404).json({
        message: "Attendance between the user and the event does not exist",
        statusCode: 404,
      });
    }

    // Authorization
    const groupMember = await GroupMember.findOne({
      where: {
        userId,
        groupId,
      },
    });
    if (!["organizer", "co-host"].includes(groupMember.role)) {
      return res.status(401).json({
        message: "Unauthorized",
        statusCode: 401,
      });
    }

    attendance.status = status;
    await attendance.save();

    return res.json(attendance);
  }
);

// Delete attendance to an event specified by id
// DELETE /api/groups/:groupId/events/:eventId/attendees
router.delete("/:eventId/attendees", async (req, res, next) => {
  const { eventId, groupId } = req.params;
  const { id: userId } = req.user;
  const { userId: attendeeId } = req.body;

  const event = await Event.findByPk(eventId);
  if (!event) {
    return res.status(404).json({
      message: "Event couldn't be found",
      statusCode: 404,
    });
  }

  const attendance = await EventUser.findOne({
    where: {
      eventId,
      userId: attendeeId,
    },
  });
  if (!attendance) {
    return res.status(404).json({
      message: "Attendance does not exist for this User",
      statusCode: 404,
    });
  }

  // Authorization
  const groupMember = await GroupMember.findOne({
    where: {
      userId,
      groupId,
    },
  });
  const isUser = userId === attendeeId;
  const isOrganizer = groupMember.role === "organizer";

  if (!isUser && !isOrganizer) {
    return res.status(401).json({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  await attendance.destroy();

  return res.json({
    message: "Successfully deleted attendance from event",
  });
});

module.exports = router;
