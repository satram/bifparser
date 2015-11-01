
var fileSize, timeStamp, byteOffset, frameSize, bifHeaderLength = 64;

function loadBifFile(dynamic_url) {
  fileSize = 0;
  var selected_movie = $('#movie :selected').text();
  console.log(selected_movie);
  var dynamic_url = 'http://' + window.location.hostname + ':'
    + window.location.port + '/api/images/' + selected_movie + '.bif'
  console.log(dynamic_url)
  getFileSize(dynamic_url);
  var bifHeaderByteRange = "bytes=0-" + (bifHeaderLength - 1);
  downloadBinaryData(dynamic_url, bifHeaderByteRange, parseBifHeader);
}

function strToByteArray(str) {
  var bufView = new Uint8Array(str.length);
  for (var i=0, strLen=str.length; i<strLen; i++) {
   bufView[i] = (str.charCodeAt(i) & 0xFF) >>> 0;
  }
  return bufView;
}

function downloadBinaryData(dynamic_url, byterange, callback) {
  console.log("downloading", byterange, "in", dynamic_url);
  jQuery.ajax({
    url: dynamic_url,
    type: 'GET',
    dataType: 'binary',
    processData: false,
    headers: {Range: byterange},
    responseType: 'arraybuffer'
  }).done(function (buffer) {
    var outBuffer = new Uint8Array(buffer);
    console.log("downloaded", outBuffer.length, "bytes");
    callback(outBuffer, dynamic_url);
  });
}

function downloadString(dynamic_url, byterange, callback) {
  console.log("downloading", byterange, "in", dynamic_url);
  jQuery.ajax({
    url: dynamic_url,
    type: 'GET',
    dataType: 'text',
    headers: {Range: byterange},
  }).done(function (buffer) {
    console.log("downloaded", buffer.length, "bytes");
    callback(buffer, dynamic_url);
  });
}

function getFileSize(dynamic_url) {
  console.log("get filesize for ", dynamic_url);
  var request = jQuery.ajax({
    url: dynamic_url,
    type: 'HEAD',
    success: function () {
      fileSize = request.getResponseHeader("Content-Length");
      console.log("filesize is", fileSize);
    }
  });
}

function scaleNum(num, pos) {
  var scaled = (num << ( 8 * pos)) >>> 0;
  return scaled;
}

function readUint32(bytes, pos) {
  var result = scaleNum(bytes[pos], 0) + scaleNum(bytes[pos+1], 1) + scaleNum(bytes[pos+2], 2) + scaleNum(bytes[pos+3], 3);
  return result;
}

function parseBifHeader(header, dynamic_url) {
  //   console.log(ConvertBase.dec2hex(header[i]));

  var version = readUint32(header, 8);
  console.log("version", version);

  var numFrames = readUint32(header, 12);
  console.log("numFrames", numFrames);

  var timeStampMultiplier = readUint32(header, 16);
  console.log("timeStampMultiplier", timeStampMultiplier);

  var bifIndexLength = numFrames * 8;
  console.log("bifIndexLength", bifIndexLength);

  var bifIndexByteRange = "bytes=64-" + (64 + bifIndexLength-1);
  // console.log("bifIndexByteRange", bifIndexByteRange);

  downloadBinaryData(dynamic_url, bifIndexByteRange, parseBifIndexHeader);
}

function parseBifIndexHeader(header, dynamic_url){
  // var header = strToByteArray(buffer);
  var indexLength = header.length;
  var numFrames = indexLength / 8;
  timeStamp = new Uint32Array(numFrames);
  byteOffset = new Uint32Array(numFrames);
  frameSize = new Uint32Array(numFrames);

  var i = 0, j = 0;
  timeStamp[j] = readUint32(header, i);
  byteOffset[j] = readUint32(header, i+4);
  i = i+8; j++;
  for (;i < indexLength; j++, i=i+8) {
    timeStamp[j] = readUint32(header, i);
    byteOffset[j] = readUint32(header, i+4);
    frameSize[j-1] = byteOffset[j] - byteOffset[j-1];
    console.log("Frame", j-1, "timeStamp", timeStamp[j-1], "byteOffset", byteOffset[j-1], "frameSize", frameSize[j-1]);
  }
  frameSize[j-1] = fileSize - byteOffset[j-1];
  console.log("Frame", j-1, "timeStamp", timeStamp[j-1], "byteOffset", byteOffset[j-1], "frameSize", frameSize[j-1]);
}

function playFile(){
  var selected_movie = $('#movie :selected').text();
  var dynamic_url = 'http://' + window.location.hostname + ':'
    + window.location.port + '/api/images/' + selected_movie + '.bif'
  _.each(byteOffset, function(offset){
      var frameIndex = _.indexOf(byteOffset, offset);
      var frameByteRange = "bytes=" + offset + "-" + (offset+frameSize[frameIndex]-1);
      downloadBinaryData(dynamic_url, frameByteRange, renderImage);
  });
}

function hexToBase64(str) {
    return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
}

function renderImage(header, dynamic_url) {
  var img = document.createElement('img');
  img.src = 'data:image/jpeg;base64,' + btoa(ab2str(header));
  document.body.appendChild(img);
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, buf);
}

function redirect() {
    window.location.href = "mailto:satheesh.ram@gmail.com";
}
