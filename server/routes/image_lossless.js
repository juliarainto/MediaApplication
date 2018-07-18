/* eslint no-console: 0 */
import express from "express";
import fs from "fs";
import _ from "lodash";
import gulp from "gulp";
import imagemin from "gulp-imagemin";
import "babel-polyfill";

const mime = {
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml"
};

const compressionDone = async fileNames => {
  try {
    const imagesToReturn = [];
    _.each(fileNames, file => {
      const ext = file
        .substring(file.lastIndexOf(".") + 1)
        .toString()
        .toLowerCase();
      const type = mime[ext] || "text/plain";

      const curImg = fs.readFileSync(`./compressed/${file}`);
      const toBase64 = Buffer.from(curImg).toString("base64");

      const stats = fs.statSync(`./uploads/${file}`);
      const fileSizeInBytes = stats.size;
      const fileSizeInKilobytes = fileSizeInBytes / 1000.0;
      const fileSizeInMegabytes = fileSizeInBytes / 1000000.0;

      let originalFileSizeToReturn = `${fileSizeInKilobytes
        .toFixed(2)
        .toString()} KB`;
      if (fileSizeInKilobytes >= 1000.0) {
        originalFileSizeToReturn = `${fileSizeInMegabytes
          .toFixed(2)
          .toString()} MB`;
      }

      const statsCompressed = fs.statSync(`./compressed/${file}`);
      const fileSizeInBytesCompressed = statsCompressed.size;
      const fileSizeInKilobytesCompressed = fileSizeInBytesCompressed / 1000.0;
      const fileSizeInMegabytesCompressed =
        fileSizeInBytesCompressed / 1000000.0;

      let originalFileSizeToReturnCompressed = `${fileSizeInKilobytesCompressed
        .toFixed(2)
        .toString()} KB`;
      if (fileSizeInKilobytesCompressed >= 1000.0) {
        originalFileSizeToReturnCompressed = `${fileSizeInMegabytesCompressed
          .toFixed(2)
          .toString()} MB`;
      }

      const fileSizeInBytesS =
        (1 - fileSizeInBytesCompressed / fileSizeInBytes) * 100;
      const fileSizeFixedBytesS = fileSizeInBytesS.toFixed(2);

      const fileObj = {
        filename: file,
        mime: type,
        extension: ext,
        data: `data:${type};base64,${toBase64}`,
        originalSize: originalFileSizeToReturn,
        compressedSize: originalFileSizeToReturnCompressed,
        spaceSaving: `${fileSizeFixedBytesS} %`
      };
      imagesToReturn.push(fileObj);
      fs.unlink(`./uploads/${file}`, err => {
        if (err) {
          console.log("failed to delete image");
        } else {
          console.log("successfully deleted image");
        }
      });
    });
    return imagesToReturn;
  } catch (e) {
    throw new Error(e);
  }
};

export default (() => {
  const router = express();
  router.post("/compress_lossless", async (req, res) => {
    try {
      if (!req.files) return res.status(400).send("Kuvia ei ladattu");
      let { file } = req.files;
      if (!file.length) {
        file = [file];
      }
      const uploadsFolder = fs.existsSync(`./uploads`);
      if (!uploadsFolder) {
        fs.mkdirSync(`./uploads`);
      }

      req.setTimeout(7200000);

      const filesNames = [];

      const { myTokenFront } = req.body;

      // LOSSLESS
      gulp.task("compress-images-lossless", () =>
        Promise.all([
          new Promise((resolve, reject) => {
            gulp
              .src("./uploads/*")
              .pipe(
                imagemin([
                  imagemin.optipng({
                    optimizationLevel: 5
                  }),
                  imagemin.jpegtran({
                    progressive: true
                  })
                ])
              )
              .on("error", reject)
              .pipe(gulp.dest("./compressed"))
              .on("end", resolve);
          })
        ]).then(async () => {
          const getCompressedData = await compressionDone(filesNames);

          return res.status(200).json({
            Message: "Kuvat latautuivat onnistuneesti!",
            data: getCompressedData
          });
        })
      );
      _.each(file, imageFile => {

        let start = imageFile.name.substring(
          0,
          imageFile.name.lastIndexOf(".")
        );
        start = start.replace(/[^a-zA-Z0-9]/g, "_");
        const end = imageFile.name.substring(imageFile.name.lastIndexOf("."));

        const filename = start + myTokenFront + end;
        filesNames.push(filename);


        imageFile.mv(`./uploads/${filename}`, err => {
          if (err) {
            console.log(err);
            return false;
          }
          return true;
        });
      });

      await gulp.start("compress-images-lossless");
      return true;
    } catch (e) {
      console.log(e);
      return res
        .status(400)
        .send(`Virhe ladattaessa tai kuvanpakkaamisessa: ${e.toString()}`);
    }
  });
  return router;
})();
