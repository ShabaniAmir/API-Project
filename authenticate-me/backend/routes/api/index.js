const router = require("express").Router();
const sessionRouter = require("./session.js");
const UsersRouter = require("./users.js");
const GroupsRouter = require("./groups.js");
const { restoreUser } = require("../../utils/auth.js");

// Connect restoreUser middleware to the API router
// If current user session is valid, set req.user to the user in the database
// If current user session is not valid, set req.user to null
router.use(restoreUser);

router.use("/session", sessionRouter);

router.use("/users", UsersRouter);

router.use("/groups", GroupsRouter);

router.post("/test", (req, res) => {
  res.json({ requestBody: req.body });
});

module.exports = router;
