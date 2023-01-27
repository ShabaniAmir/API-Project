const router = require("express").Router();

// GET /api/set-token-cookie
const { setTokenCookie } = require("../../utils/auth.js");
const { User } = require("../../db/models");

// GET /api/restore-user
const { restoreUser } = require("../../utils/auth.js");

router.use(restoreUser);

router.get("/restore-user", (req, res) => {
  return res.json(req.user);
});

module.exports = router;
