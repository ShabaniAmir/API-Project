const express = require("express");
const {
  setTokenCookie,
  restoreUser,
  requireAuth,
} = require("../../utils/auth");
const { User, Group, GroupMember } = require("../../db/models");
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

router.get("/", async (req, res) => {
  const groups = await Group.findAll();
  return res.json(groups);
});

router.get("/mine", requireAuth, (req, res) => {
  const { id } = req.user;
  GroupMember.findAll({
    where: {
      userId: id,
    },
    include: Group,
  }).then((groups) => {
    return res.json(groups);
  });
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

module.exports = router;
