const express = require("express");
const router = express.Router();
// config
const { environment } = require("../config");
const { requireAuth } = require("../utils/auth");

const apiRouter = require("./api");

router.use("/api", apiRouter);

router.get("/api/csrf/restore", (req, res) => {
  if (environment === "production") {
    return;
  }

  const csrfToken = req.csrfToken();
  res.cookie("XSRF-TOKEN", csrfToken);
  res.status(200).json({
    "XSRF-Token": csrfToken,
  });
});

module.exports = router;
