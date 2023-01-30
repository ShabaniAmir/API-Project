const express = require("express");
const {
  setTokenCookie,
  restoreUser,
  requireAuth,
} = require("../../utils/auth");
const {
  User,
  Group,
  GroupMember,
  Image,
  Sequelize,
} = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const VenuesRouter = require("./venues.js");
const EventsRouter = require("./events.js");
const router = express.Router({ mergeParams: true });

const validateGroup = [
  check("name")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a name for your group."),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a description for your group."),
  check("type")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a type for your group."),
  check("private")
    .exists()
    .withMessage("Please provide a privacy setting for your group."),
  check("city")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a city for your group."),
  check("state")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a state for your group."),
  check("previewImage")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a preview image for your group."),
  handleValidationErrors,
];

// Get all groups
router.get("/", async (req, res) => {
  const groups = await Group.findAll();
  return res.json(groups);
});
// Create Group
router.post("/", [requireAuth, validateGroup], async (req, res) => {
  // Get id of logged in user
  const { id } = req.user;
  // Get group info from request body
  const { name, about, type, private, city, state, previewImage } = req.body;
  // Create new group
  const group = await Group.create({
    name,
    about,
    type,
    private,
    city,
    state,
    previewImage,
    organizerId: id,
  });

  // Associate logged in user with new group
  await GroupMember.create({
    userId: id,
    groupId: group.id,
    role: "organizer",
  });

  return res.json({
    group,
  });
});
// Get all groups that a user is a member of
router.get("/mine", requireAuth, (req, res) => {
  const { id } = req.user;
  const returnArray = [];
  GroupMember.findAll({
    where: {
      userId: id,
    },
    include: Group,
  }).then((groups) => {
    groups.forEach((group) => {
      returnArray.push(group.Group);
    });
    return res.json(returnArray);
  });
});
// Get group by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const group = await Group.findByPk(id);
  return res.json(group);
});
// Create image for group
router.post("/:id/images", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { url, preview } = req.body;

  const { id: groupId } = req.params;
  // Get group from database
  const group = await Group.findByPk(groupId);
  // Authorize user
  const groupMember = await GroupMember.findOne({
    where: {
      userId: req.user.id,
      groupId: id,
    },
  });
  if (groupMember.role !== "organizer") {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.message = "Unauthorized";

    return next(err);
  }

  const image = await Image.create({
    url,
    preview,
    groupId: id,
  });
  return res.json(image);
});
// Venue Routes
router.use("/:groupId/venues", VenuesRouter);
// Event Routes
router.use("/:groupId/events", EventsRouter);
// Update Group
router.put("/:id", [requireAuth, validateGroup], async (req, res) => {
  // Get id of logged in user
  const { id } = req.user;
  // Get group info from request body
  const { name, description, type, private, city, state, previewImage } =
    req.body;
  // Get group id from request params
  const { id: groupId } = req.params;
  // Get group from database
  const group = await Group.findByPk(groupId);
  // Authorize user
  const groupMember = await GroupMember.findOne({
    where: {
      userId: req.user.id,
      groupId: id,
    },
  });
  if (groupMember.role !== "organizer") {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.message = "Unauthorized";

    return next(err);
  }

  // Update group
  await group.update({
    name,
    description,
    type,
    private,
    city,
    state,
    previewImage,
  });
  return res.json({
    group,
  });
});
// Delete Group
router.delete("/:id", requireAuth, async (req, res) => {
  // Get id of logged in user
  const { id } = req.user;
  // Get group id from request params
  const { id: groupId } = req.params;
  // Get group from database
  const group = await Group.findByPk(groupId);
  // Check if logged in user is the organizer of the group
  if (group.organizerId !== id) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.message = "Unauthorized";
    return next(err);
  }
  // Delete group
  await group.destroy();
  return res.json({
    message: "Successfully deleted",
    statusCode: 200,
  });
});

// Get all members of a group
router.get("/:id/members", async (req, res) => {
  const { id: groupId } = req.params;
  const { id: userId } = req.user;

  // Does group exist
  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    err.message = "Group not found";

    return next(err);
  }

  // is user organizer of group
  const groupMember = await GroupMember.findOne({
    where: {
      userId,
      groupId,
    },
  });
  if (groupMember.role !== "organizer") {
    const members = await GroupMember.findAll({
      where: {
        groupId,
        status: {
          [Sequelize.Op.not]: "pending",
        },
      },
      include: User,
    });
  } else {
    const members = await GroupMember.findAll({
      where: {
        groupId,
      },
      include: User,
    });
  }
  return res.json(members);
});

// Request membership
// POST /api/groups/:id/members
router.post("/:id/members", requireAuth, async (req, res) => {
  const { id: groupId } = req.params;
  const { id: userId } = req.user;

  // Does group exist
  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    err.message = "Group not found";
    return next(err);
  }

  // is user already a member or pending
  const groupMember = await GroupMember.findOne({
    where: {
      userId,
      groupId,
    },
  });
  if (groupMember) {
    if (groupMember.role === "pending") {
      //Membership has already been requested
      const err = new Error("Membership has already been requested");
      err.statusCode = 400;
      err.message = "Membership has already been requested";
      return next(err);
    } else {
      // User is already a member of the group
      const err = new Error("User is already a member of the group");
      err.statusCode = 400;
      err.message = "User is already a member of the group";
      return next(err);
    }
  }

  // Create membership
  const membership = await GroupMember.create({
    userId,
    groupId,
    status: "pending",
  });
  return res.json(membership);
});

// Update membership
// PUT /api/groups/:id/members
const validateMembershipUpdate = [
  check("memberId")
    .exists({ checkFalsy: true })
    .withMessage("Member id is required")
    .isInt()
    .withMessage("Member id must be an integer"),
  check("status")
    .exists({ checkFalsy: true })
    .withMessage("Status is required"),
];
router.put("/:id/members/", requireAuth, async (req, res) => {
  const { id: groupId } = req.params;
  const { id: userId } = req.user;
  const { memberId, status } = req.body;

  const requiresElevatedPrivileges = status === "co-host";

  // Does group exist
  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Group couldn't be found");
    err.statusCode = 404;
    err.message = "Group couldn't be found";
    return next(err);
  }

  // Does member exist
  const member = await GroupMember.findOne({
    where: {
      userId: memberId,
      groupId,
    },
  });

  if (!member) {
    const err = new Error("User couldn't be found");
    err.statusCode = 404;
    err.message = "User couldn't be found";
    return next(err);
  }

  // Authorization
  const groupMember = await GroupMember.findOne({
    where: {
      userId,
      groupId,
    },
  });
  if (requiresElevatedPrivileges && groupMember.role !== "organizer") {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    err.message = "Unauthorized";
    return next(err);
  }

  if (
    !requiresElevatedPrivileges &&
    ["co-host", "organizer"].includes(groupMember.role)
  ) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    err.message = "Unauthorized";
    return next(err);
  }

  // Update membership
  await member.update({
    status,
  });
  return res.json(member);
});

// Delete membership
// DELETE /api/groups/:id/members
router.delete("/:id/members", requireAuth, async (req, res) => {
  const { id: groupId } = req.params;
  const { id: userId } = req.user;
  const { memberId } = req.body;

  // Does group exist
  const group = await Group.findByPk(groupId);
  if (!group) {
    return res.status(400).json({
      message: "Group couldn't be found",
      statusCode: 400,
    });
  }

  // Does member exist
  const member = await GroupMember.findOne({
    where: {
      userId: memberId,
      groupId,
    },
  });

  if (!member) {
    return res.status(400).json({
      message: "Validation Error",
      statusCode: 400,
      errors: {
        memberId: "User couldn't be found",
      },
    });
  }

  // Authorization
  const groupMember = await GroupMember.findOne({
    where: {
      userId,
      groupId,
    },
  });
  if (groupMember.role !== "organizer" && userId !== memberId) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.message = "Unauthorized";

    return next(err);
  }

  // Delete membership
  await member.destroy();
  return res.json({
    message: "Successfully deleted membership from group",
  });
});

module.exports = router;
