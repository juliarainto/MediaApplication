/* eslint no-console: 0 */
import express from "express";
import fs from "fs";
import _ from "lodash";
import gulp from "gulp";
import imagemin from "gulp-imagemin";
import "babel-polyfill";

// imagemin-libraries
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import imageminZopfli from "imagemin-zopfli";
import imageminGiflossy from "imagemin-giflossy";

// These are the mimetypes for each type of image extension
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

      // Delete uploaded files after they are compressed
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
  router.post("/compress_lossy", async (req, res) => {
    try {
      if (!req.files) return res.status(400).send("Tiedostoja ei ladattu");
      let { file } = req.files;
      if (!file.length) {
        file = [file];
      }
      const uploadsFolder = fs.existsSync(`./uploads`);
      if (!uploadsFolder) {
        fs.mkdirSync(`./uploads`);
      }

      req.setTimeout(7200000);

      const { myTokenFront } = req.body;

      const filesNames = [];

      gulp.task("compress-images-lossy", () =>
        Promise.all([
          new Promise((resolve, reject) => {
            gulp
              .src("./uploads/*")
              .pipe(
                imagemin([
                  imageminPngquant({
                    speed: 1,
                    quality: 60
                  }),
                  imageminZopfli({
                    more: true
                  }),
                  imageminGiflossy({
                    optimizationLevel: 3,
                    optimize: 3,
                    lossy: 80
                  }),
                  imageminMozjpeg({
                    quality: 75
                  }),
                  imagemin.svgo({
                    multipass: true, // best compression
                    plugins: [{
                        removeViewBox: true // IE and Edge require view box
                      },
                      {
                        cleanupIDs: false  //unused by svg file, but what about website?
                      }, 
                      {
                        removeUselessStrokeAndFill: false // are strokes and fill really unuseful?
                      },
                      {
                        removeEmptyAttrs: false // allowed by HTML5
                      }
                    ]
                  })
                ])
              )
              .on("error", reject)
              .pipe(gulp.dest("./compressed"))
              .on("end", resolve);
          })
        ])
          .then(async () => {
            const getCompressedData = await compressionDone(filesNames);
            return res.status(200).json({
              Message: "Kuvat latautuivat onnistuneesti!",
              data: getCompressedData
            });
          })
          .catch(err => {
            console.log(err);
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
      await gulp.start("compress-images-lossy");
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
