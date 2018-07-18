/* eslint no-console: 0 */
import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import fileUpload from "express-fileupload";
import findRemoveSync from "find-remove";
import fs from "fs";
import https from "https";
import "babel-polyfill";

const sslEnabled = false;

const app = express();
const PORT = 3000;
const routes = require("./routes/index");

app.use(
  bodyParser.json(),
  cors(),
  morgan("tiny"),
  fileUpload({
    limits: {
      fileSize: 50 * 1024 * 1024
    }
  })
);

app.get("/compressed/:filename/:token", (req, res) => {
  const { filename, token } = req.params;
  const lastDash = filename.lastIndexOf("/");
  const parsedFilename = filename.substr(lastDash + 1);
  if (parsedFilename.includes(token)) {
    res.download(
      path.join(__dirname, `./compressed/`, `${req.params.filename}`)
    );
  } else {
    res.status(400).send("Unauthorized");
  }
});

app.use("/", routes);

if (sslEnabled) {
  const httpsOptions = {
    key: fs.readFileSync("/var/www/certs/privkey.pem"),
    cert: fs.readFileSync("/var/www/certs/fullchain.pem")
  };

  https.createServer(httpsOptions, app).listen(PORT);
  console.log(`Server is now running on https://localhost:${PORT}`);
} else {
  app.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}`);
    console.log(`Post files to http://localhost:${PORT}/upload_image`);
  });
}

setInterval(() => {
  findRemoveSync("./compressed", {
    files: "*.*",
    age: {
      seconds: 300
    }
  });
}, 30 * 1000 * 60);

setInterval(() => {
  findRemoveSync("./uploads", {
    files: "*.*",
    age: {
      seconds: 300
    }
  });
}, 30 * 1000 * 60);
