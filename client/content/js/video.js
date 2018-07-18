let tokenToBackend = "";

$(function () {
  $("#uploadCompressButton").click(function () {
    if ($("#chooseVideoResolution").val() === "muu") {
      if (!$("#widthFront").val() || !$("#heightFront").val()) {
        swal(
          "Something went wrong!",
          "Insert width and height",
          "error"
        );
      } else {
        compressFiles();
        $("#uploadCompressButton").attr("disabled", true);
        $("#resetButton").attr("disabled", true);
        $("#spinn").show();
        $("#video-items").show();
      }
    } else if ($("#fileInputCompress")[0].files.length === 0) {
      swal("Something went wrong!", "Add file to convert", "error");
      !$("#fileInputCompress").focus();
      return false;
    } else {
      compressFiles();
      $("#uploadCompressButton").attr("disabled", true);
      $("#resetButton").attr("disabled", true);
      $("#spinn").show();
      $("#video-items").show();
    }
  });

  $(".slider").slider({
    indicators: false,
    height: 300,
    transition: 500,
    interval: 6000
  });

  $(".modal").modal();

  $("#spinn").hide();

  $(".dropify").dropify();

  $(".button-collapse").sideNav({
    menuWidth: 300,
    edge: "left",
    closeOnClick: true,
    draggable: true,
    onOpen: function (el) {},
    onClose: function (el) {}
  });

  const select = $("select");

  $("#resetButton").click(function () {
    $("form input").val("");
    $("#aspectRatio").hide();
    $(".dropify-clear").click();
    $("#video-items").hide();
    select.prop("selectedIndex", 0);
    select.material_select();
  });
  select.material_select();
  $("select").material_select();

  $("#chooseVideoResolution").change(function (e) {
    if (e.target.value === "muu") {
      $("#muu-koko").show();
      $("#aspectRatio").hide();
    } else {
      $("#muu-koko").hide();
      $("#aspectRatio").show();
    }
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').then(function (registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function (err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

function initialize() {
  $(".button-collapse").sideNav();
  $(".button-collapse").click(removeOverlay);
}

function removeOverlay() {
  $("div[id^=sidenav-overlay]").remove();
}

async function compressFiles() {
  $("#video-items").html("");

  const inputFiles = document.getElementById("fileInputCompress").files;
  if (inputFiles) {
    for (let i = 0; i < inputFiles.length; i++) {
      $("#spinn").show();
      let returnedMessage = await uploadFileAndAddCompressedToBody(
        inputFiles[i]
      );
      $("#uploadCompressButton").attr("disabled", false);
      $("#spinn").hide();
    }
  } else {
    alert("No files attached!");
  }
}
const uploadFileAndAddCompressedToBody = async file => {
  return new Promise(function (resolve, reject) {
    const formData = new FormData();
    formData.append("file", file);

    const filename = file.name;
    let inputExtension = filename
      .substring(filename.lastIndexOf("."))
      .split(".")[1]
      .toLowerCase();
    formData.append("inputVideoType", inputExtension);

    const outputExtension = $("#outputExtensionType").val();
    formData.append("outputVideoType", outputExtension);

    let extention = outputExtension || inputExtension;

    const outputSize = $("#chooseVideoResolution").val();
    formData.append("outputVideoFormat", outputSize);

    let outputWidthSize = $("#widthFront").val();
    formData.append("outputWidthFront", outputWidthSize);

    let outputHeightSize = $("#heightFront").val();
    formData.append("outputHeightFront", outputHeightSize);

    let outputAspect = $("#checkedRatio").prop("checked");
    formData.append("outputAspectFormat", outputAspect);

    let videoQuality = outputExtension === "avi" ? true : false;
    if (videoQuality) {
      videoQuality = "7";
    } else {
      videoQuality = "5";
    }
    formData.append("videoQuality", videoQuality);

    if (!localStorage.getItem("cortana")) {
      const myUUID = uuidv1();
      localStorage.setItem("cortana", myUUID);
      tokenToBackend = myUUID;
    } else {
      tokenToBackend = localStorage.getItem("cortana");
    }

    formData.append("myTokenFront", tokenToBackend);

    const request = new XMLHttpRequest();
    const sslEnabled = false;
    if (sslEnabled) {
      request.open("POST", "https://your_address.com:3000/compress_video_child");
    } else {
      request.open("POST", "http://localhost:3000/compress_video_child");
    }

    console.log(inputExtension);

    let poster_Picture =
      extention === "avi" ||
      extention === "flv" ||
      extention === "wmv" ||
      extention === "mov" ?
      true :
      false;
    if (poster_Picture) {
      poster_Picture = "./content/img/not_available.jpg";
    } else {
      poster_Picture = "./content/img/play_button.jpg";
    }

    // Listen for the servers feedback
    request.onload = function (event) {
      if (request.status == 200) {
        $("#resetButton").prop("disabled", false);
        const response = JSON.parse(request.responseText);
        const filename = response.data[0].filename;
        const {
          originalSize
        } = response.data[0];
        const {
          compressedSize
        } = response.data[0];
        const {
          spaceSaving
        } = response.data[0];
        const sslEnabled = false;

        let compressedURL = "";
        if (sslEnabled) {
          compressedURL = `https://your_address.com:3000/compressed/${filename}/${tokenToBackend}`;
        } else {
          compressedURL = `http://localhost:3000/compressed/${filename}/${tokenToBackend}`;
        }

        $("#video-items").append(
          `
          <div id='video' class="col s12">
            <div class="center-align">
              <div style='margin-bottom: 20px'>
                <video width="640" height="360" id="vid" src=${compressedURL} poster= ${poster_Picture} controls>
                  Your browser does not support the video tag.
                </video>
                <br>
                <p style='text-align: center; '><span class="teal-text" style="font-weight:bold"> Original size:  </span> ${originalSize}</p>
                <p style='text-align: center; '><span class="teal-text" style="font-weight:bold"> Compressed size: </span> ${compressedSize}</p>
                <p style='text-align: center; '><span class="teal-text" style="font-weight:bold"> Size difference:  </span> ${spaceSaving}</p>

                <button id="saveOtherFormats" class="waves-effect waves-light btn" type='button' onclick="downloadFile('${compressedURL}')">Save</button>
                
            </div>
        </div>
          `
        );

        resolve("Compression Done!");
      } else {
        reject("Error compressing!");
      }
    };

    request.onerror = function () {
      console.log("** An error occurred during the transaction");
      if (request.status === 400) {
        swal({
          title: "Something went wrong!",
          text: "you don't have the rights to upload this file.",
          icon: "error",
          button: "OK!"
        }).then(button => {
          window.location.href = "./videopakkaus.html";
        });
      } else {
        swal({
          title: "Something went wrong!",
          text: "Press OK to continue",
          icon: "error",
          button: "OK!"
        }).then(button => {
          window.location.href = "./videopakkaus.html";
        });
      }
    };
    request.send(formData);
  });
};

function downloadFile(url) {
  fetch(url)
    .then(res => res.blob({}))
    .then(blob => {
      let newFilename = url.split("compressed/")[1];
      newFilename = newFilename.split("/")[0];
      newFilename = newFilename.replace(tokenToBackend, "");
      console.log(newFilename);
      saveAs(blob, newFilename);
    });
}