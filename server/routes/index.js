/* eslint no-console: 0 */
import express from "express";
import "babel-polyfill";

import ImageLossy from "./image_lossy";
import ImageLossless from "./image_lossless";
import videoCompress from "./video_compress";

const router = express.Router();
router.use(ImageLossy, ImageLossless, videoCompress);

module.exports = router;
