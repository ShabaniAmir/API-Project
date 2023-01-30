const express = require("express");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router({ mergeParams: true });
const { Venue, Group } = require("../../db/models");
const { requireAuth } = require("../../utils/auth");

const validateVenue = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Please provide an address for your venue."),
  check("city")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a city for your venue."),
  check("state")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a state for your venue."),
  check("lat")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a latitude for your venue."),
  check("lng")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a longitude for your venue."),
  handleValidationErrors,
];

// Get all venues
// TODO: filter venues by group id from params
router.get("/", async (req, res) => {
  const venues = await Venue.findAll();
  return res.json(venues);
});

// Create a new venue
router.post("/", [requireAuth, validateVenue], async (req, res, next) => {
  // Get group id from request params
  const { groupId } = req.params;
  console.log({ groupId });
  // Get user
  const { id: userId } = req.user;
  // Check if the group the venue is being created for belongs to the user
  const group = await Group.findByPk(groupId);
  if (!group) {
    const err = new Error("Not Found");
    err.status = 404;
    err.message = "Not Found";

    return next(err);
  }
  if (group.organizerId !== userId) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.message = "Unauthorized";

    return next(err);
  }

  // Get venue info from request body
  const { address, city, state, lat, lng } = req.body;
  // Create new venue
  const venue = await Venue.create({
    address,
    city,
    state,
    lat,
    lng,
    groupId,
  });
  return res.json(venue);
});

// Edit a venue
router.put(
  "/:venueId",
  [requireAuth, validateVenue],
  async (req, res, next) => {
    // Get venue id from request params
    const { venueId } = req.params;
    // Get user
    const { id: userId } = req.user;
    // Get venue
    const venue = await Venue.findByPk(venueId);
    if (!venue) {
      const err = new Error("Not Found");
      err.status = 404;
      err.message = "Not Found";

      return next(err);
    }
    // Check if the group the venue belongs to belongs to the user
    const group = await Group.findByPk(venue.groupId);
    if (group.organizerId !== userId) {
      const err = new Error("Unauthorized");
      err.status = 401;
      err.message = "Unauthorized";

      return next(err);
    }
    // Get venue info from request body
    const { address, city, state, lat, lng } = req.body;
    // Update venue
    await venue.update({
      address,
      city,
      state,
      lat,
      lng,
    });
    return res.json(venue);
  }
);

module.exports = router;
