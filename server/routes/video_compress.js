/* eslint no-console: 0 */
import express from "express";
import fs from "fs";
import { execFile } from "child_process";
import "babel-polyfill";

export default (() => {
  const router = express();
  router.post("/compress_video_child", async (req, res) => {
    if (!req.files) return res.status(400).send("Tiedostoja ei ladattu");

    req.setTimeout(7200000);

    // Initialize variables
    let file = null;
    let fileName = null;
    let inputExtensionType = null;
    let outputExtensionType = null;
    let extensionToUse = null;
    let outputSizeFormat = null;
    let outputAspectFormat = null;
    let width = null;
    let height = null;
    let size = null;
    let videoQuality = null;
    let audioCodec = null;
    let videoCodec = null;
    let myTokenFront = null;

    // Functions -----------------------------------------------

    async function initializeVariables() {
      return new Promise(async resolve => {
        const uploadsFolder = fs.existsSync(`./uploads`);
        if (!uploadsFolder) {
          fs.mkdirSync(`./uploads`);
        }

        const compressedFolder = fs.existsSync(`./compressed`);
        if (!compressedFolder) {
          fs.mkdirSync(`./compressed`);
        }

        file = req.files;

        inputExtensionType = req.body.inputVideoType;

        outputExtensionType = req.body.outputVideoType
          ? req.body.outputVideoType
          : false;

        outputSizeFormat = req.body.outputVideoFormat
          ? req.body.outputVideoFormat
          : false;

        width = req.body.outputWidthFront ? req.body.outputWidthFront : "?";

        height = req.body.outputHeightFront ? req.body.outputHeightFront : "?";

        if (req.body.outputAspectFormat === "false") {
          outputAspectFormat = false;
        } else {
          outputAspectFormat = true;
        }

        videoQuality = req.body.videoQuality;

        myTokenFront = req.body.myTokenFront;

        extensionToUse =
          outputExtensionType === "null"
            ? inputExtensionType
            : outputExtensionType;

        switch (extensionToUse) {
          case "avi":
            audioCodec = "adpcm_ms";
            videoCodec = "mpeg4";
            break;
          case "flv":
            audioCodec = "libmp3lame";
            videoCodec = "libx264";
            break;
          case "mp4":
            audioCodec = "aac";
            videoCodec = "libx264";
            break;
          case "mov":
            audioCodec = "aac";
            videoCodec = "mpeg4";
            break;
          case "ogv":
            audioCodec = "libvorbis";
            videoCodec = "libtheora";
            break;
          case "webm":
            audioCodec = "libvorbis";
            videoCodec = "libvpx";
            break;
          case "wmv":
            audioCodec = "wmav2";
            videoCodec = "mpeg4";
            break;

          default:
            audioCodec = "aac";
            videoCodec = "libx264";
        }

        switch (outputSizeFormat) {
          case "3840x?":
            if (outputAspectFormat) {
              size = "2160x3840";
            } else {
              size = "3840x2160";
            }
            break;
          case "2560x?":
            if (outputAspectFormat) {
              size = "1440x2560";
            } else {
              size = "2560x1440";
            }
            break;
          case "1920x?":
            if (outputAspectFormat) {
              size = "1080x1920";
            } else {
              size = "1920x1080";
            }
            break;
          case "1280x?":
            if (outputAspectFormat) {
              size = "720x1280";
            } else {
              size = "1280x720";
            }
            break;
          case "854x?":
            if (outputAspectFormat) {
              size = "480x854";
            } else {
              size = "854x480";
            }
            break;
          case "640x?":
            if (outputAspectFormat) {
              size = "360x640";
            } else {
              size = "640x360";
            }
            break;
          case "426x?":
            if (outputAspectFormat) {
              size = "240x426";
            } else {
              size = "426x240";
            }
            break;
          case "muu":
            size = `${width}x${height}`;
            break;

          default:
            size = "default";
        }

        if (
          inputExtensionType === "mov" &&
          extensionToUse === "mov" &&
          size === "default"
        ) {
          audioCodec = "aac";
          videoCodec = "libx264";
        }
        resolve(true);
      });
    }

    async function uploadFile() {
      return new Promise(async (resolve, reject) => {
        let start = file.file.name.substring(
          0,
          file.file.name.lastIndexOf(".")
        );
        start = start.replace(/[^a-zA-Z0-9]/g, "_");
        const end = file.file.name.substring(file.file.name.lastIndexOf("."));
        fileName = `${start}${myTokenFront}${end}`;

        file.file.mv(`./uploads/${fileName}`, err => {
          if (err) {
            console.log(err);
            reject(err);
          }
          resolve(true);
        });
      });
    }

    async function removeOldCompressedIfExists() {
      return new Promise(async (resolve, reject) => {
        fs.exists(`./compressed/${fileName}`, exists => {
          if (exists) {
            fs.unlink(`./compressed/${fileName}`, error => {
              if (error) {
                console.log(error);
                reject(error);
              }
              console.log("Old compressed file removed!");
              resolve(true);
            });
          }
          resolve(true);
        });
      });
    }

    async function compressVideo() {
      return new Promise(async (resolve, reject) => {
        if (size === "default") {
          execFile(
            "ffmpeg",
            [
              "-i",
              `uploads/${fileName}`,
              "-c:v",
              `${videoCodec}`,
              "-crf",
              "23",
              "-b:v",
              "1M",
              "-q:v",
              `${videoQuality}`,
              "-c:a",
              `${audioCodec}`,
              `compressed/${fileName}`
            ],
            (error, stdout) => {
              if (error) {
                console.log(error);
                reject(error);
              } else {
                console.log(stdout);
                resolve(true);
              }
            }
          );
        } else {
          execFile(
            "ffmpeg",
            [
              "-i",
              `uploads/${fileName}`,
              "-c:v",
              `${videoCodec}`,
              "-crf",
              "23",
              "-b:v",
              "1M",
              "-q:v",
              `${videoQuality}`,
              "-acodec",
              `${audioCodec}`,
              "-s",
              `${size}`,
              `compressed/${fileName}`
            ],
            (error, stdout) => {
              if (error) {
                console.log(error);
                reject(error);
              } else {
                console.log(stdout);
                resolve(true);
              }
            }
          );
        }
      });
    }

    async function calculateDifferences() {
      return new Promise(async (resolve, reject) => {
        const ext = fileName
          .substring(fileName.lastIndexOf(".") + 1)
          .toString()
          .toLowerCase();

        let stats = null;
        try {
          stats = fs.statSync(`./uploads/${fileName}`);
        } catch (err) {
          console.log("File does not exist in uploads!");
          reject(err);
        }

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

        let statsCompressed = null;
        try {
          statsCompressed = fs.statSync(`./compressed/${fileName}`);
        } catch (err) {
          console.log("File does not exist in compressed!");
          reject(err);
        }

        const fileSizeInBytesCompressed = statsCompressed.size;
        const fileSizeInKilobytesCompressed =
          fileSizeInBytesCompressed / 1000.0;
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
          filename: fileName,
          extension: ext,
          originalSize: originalFileSizeToReturn,
          compressedSize: originalFileSizeToReturnCompressed,
          spaceSaving: `${fileSizeFixedBytesS} %`
        };

        resolve(fileObj);
      });
    }

    async function removeUploadedVideo() {
      return new Promise(async (resolve, reject) => {
        fs.exists(`./uploads/${fileName}`, exists => {
          if (exists) {
            fs.unlink(`./uploads/${fileName}`, error => {
              if (error) {
                console.log(error);
                reject(error);
              }
              resolve(true);
            });
          }
        });
      });
    }

    try {
      const start = new Date().getTime();
      console.log("-------------");
      console.log("Initializing variables...");
      await initializeVariables();
      console.log("Initializing done!");
      console.log("-------------");

      console.log("-------------");
      console.log("Uploading...");
      await uploadFile();
      console.log("Uploading done!");
      console.log("-------------");

      console.log("Checking if old compressed file exists...");
      await removeOldCompressedIfExists();

      console.log("-------------");
      console.log("Compressing...");
      await compressVideo();
      console.log("Compressing done!");
      console.log("-------------");

      console.log("-------------");
      console.log("Calculating size differences...");
      const sizeData = await calculateDifferences();
      console.log("Size differences calculated!");
      console.log("-------------");

      console.log("-------------");
      console.log("Removing uncompressed file...");
      await removeUploadedVideo();
      console.log("Uncompressed file removed!");
      console.log("-------------");

      console.log("-------------");
      console.log("All phases completed...");
      const end = new Date().getTime();
      const time = end - start;
      console.log(`Execution time: ${time}ms`);
      console.log("Sending information to client!");
      console.log("-------------");

      return res.status(200).json({
        Message: "Videot latautuivat onnistuneesti!",
        data: [sizeData]
      });
    } catch (err) {
      console.log(err);
      return res.status(200).json({
        Message: "Virhe pakkauksessa!",
        error: err.toString()
      });
    }
  });
  return router;
})();
