const express = require("express");
const {
  setTokenCookie,
  restoreUser,
  requireAuth,
} = require("../../utils/auth");
const { User, Group, GroupMember, Image } = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const router = express.Router();

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
  const user = await User.findByPk(req.user.id);
  const userGroups = await user.getGroups();
  if (!userGroups.some((group) => group.id === parseInt(id))) {
    return res
      .status(401)
      .json({ error: "You are not an organizer of this group" });
  }
  const image = await Image.create({
    url,
    preview,
    groupId: id,
  });
  return res.json(image);
});
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
  // Check if logged in user is the organizer of the group
  if (group.organizerId !== id) {
    return res

      .status(401)
      .json({ error: "You are not the organizer of this group" });
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
    return res
      .status(401)
      .json({ error: "You are not the organizer of this group" });
  }
  // Delete group
  await group.destroy();
  return res.json({
    message: "Successfully deleted",
    statusCode: 200,
  });
});

module.exports = router;
