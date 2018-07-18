let tokenToBackend = "";

$(function() {
  $("#uploadCompressButton").click(function() {
    if ($("#fileInputCompress")[0].files.length === 0) {
      swal("Something went wrong!", "Add file to convert", "error");
      !$("#fileInputCompress").focus();
      return false;
    } else {
      compressFiles();
      $("#uploadCompressButton").attr("disabled", true);
      $("#compressed-items").html("");
      $("#spinn").show();
    }
  });

  $("#uploadLosslessCheck").change(function() {
    let checkValue = $("#uploadLosslessCheck").prop("checked");
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
    onOpen: function(el) {},
    onClose: function(el) {}
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

const sslEnabled = false;

function initialize() {
  $(".button-collapse").sideNav();
  $(".button-collapse").click(removeOverlay);
}

function removeOverlay() {
  $("div[id^=sidenav-overlay]").remove();
}

async function compressFiles() {
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
  return new Promise(function(resolve, reject) {
    const formData = new FormData();
    formData.append("file", file);

    if (!localStorage.getItem("cortana")) {
      const myUUID = uuidv1();
      localStorage.setItem("cortana", myUUID);
      tokenToBackend = myUUID;
    } else {
      tokenToBackend = localStorage.getItem("cortana");
    }
    formData.append("myTokenFront", tokenToBackend);

    const request = new XMLHttpRequest();

    let checkValue = $("#uploadLosslessCheck").prop("checked");
    if (checkValue) {
      if (sslEnabled) {
        request.open("POST", "https://your_address.com:3000/compress_lossless");
      } else {
        request.open("POST", "http://localhost:3000/compress_lossless");
      }
    } else {
      if (sslEnabled) {
        request.open("POST", "https://your_address.com:3000/compress_lossy");
      } else {
        request.open("POST", "http://localhost:3000/compress_lossy");
      }
    }

    request.onload = function(event) {
      if (request.status == 200) {
        const response = JSON.parse(request.responseText);
        const filename = response.data[0].filename;
        const dataFields = response.data[0];
        const sanitizedID = dataFields.filename.replace(/\./g, "_");

        let compressedURL = "";
        if (sslEnabled) {
          compressedURL = `https://your_address.com:3000/compressed/${filename}/${tokenToBackend}`;
        } else {
          compressedURL = `http://localhost:3000/compressed/${filename}/${tokenToBackend}`;
        }

        $("#compressed-items").append(
          `
          <div id='compressed_${sanitizedID}' class="col s12 m4">
          <div class="center-align">
          <img class="compressed_medias materialboxed responsive-img" style="width:400px; height:300px;" alt="Compressed media;" src="${compressedURL}"
              />
          </div
              <br/>
              <div style='margin-bottom: 20px'>
              <p style='text-align: center; '><span class="teal-text" style="font-weight:bold"> Original size: </span> ${
                dataFields.originalSize
              }</p>
              <p style='text-align: center; '><span class="teal-text" style="font-weight:bold"> Compressed size: </span> ${
                dataFields.compressedSize
              }</p>
              <p style='text-align: center; '><span class="teal-text" style="font-weight:bold"> Filesavings: </span> ${
                dataFields.spaceSaving
              }</p>
              </div>
              <div class="center-align">
              <button class="waves-effect waves-light btn" type='button' onclick='removeFile("compressed_${sanitizedID}")'>Delete</button>
              <button class="waves-effect waves-light btn" type='button' onclick='openFile("compressed_${sanitizedID}")'>Enlarge</button>
              <button class="waves-effect waves-light btn" type='button' onclick="downloadFile('${compressedURL}')">Save</button>
              </div>
        </div>
          `
        );
        $(".materialboxed").materialbox();
        resolve("Compression Done!");
      } else {
        reject("Error compressing!");
      }
    };

    request.onerror = function() {
      console.log("** An error occurred during the transaction");
      swal({
        title: "Something went wrong!",
        text: "Press OK to continue",
        icon: "error",
        button: "OK!"
      }).then(button => {
        window.location.href = "./index.html";
      });
    };
    request.send(formData);
  });
};

function removeFile(file) {
  const fetchElementByID = $(`#${file}`);
  fetchElementByID.remove();
}

function openFile(file) {
  const fetchElementByID = $(`#${file}`);
  const newTab = window.open();
  const data = fetchElementByID.find("img").attr("src");
  newTab.document.body.innerHTML = `<img src=${data} />`;
}

function downloadFile(url) {
  fetch(url)
    .then(res => res.blob({}))
    .then(blob => {
      let newFilename = url.split("compressed/")[1];
      newFilename = newFilename.split("/")[0];
      newFilename = newFilename.replace(tokenToBackend, "");
      const start = newFilename.substring(0, newFilename.lastIndexOf("."));
      const end = newFilename.substring(newFilename.lastIndexOf("."));

      const filenameToServe = `${start}_compressed${end}`;
      saveAs(blob, filenameToServe);
    });
}
