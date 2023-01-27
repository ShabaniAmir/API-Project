const express = require("express");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();
const { Venue } = require("../../db/models");

// Get all venues
router.get("/", async (req, res) => {
  const venues = await Venue.findAll();
  return res.json(venues);
});

module.exports = router;
