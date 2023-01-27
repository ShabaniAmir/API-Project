const express = require("express");
const router = express.Router();
// config
const { environment } = require("../config");

router.get("/api/csrf/restore", (req, res) => {
    if (environment === "production") {
        return
    }

  const csrfToken = req.csrfToken();
  res.cookie("XSRF-TOKEN", csrfToken);
  res.status(200).json({
    "XSRF-Token": csrfToken,
  });
});

module.exports = router;
