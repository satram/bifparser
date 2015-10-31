var bifHeaderByteRange = "bytes=0-63";

function playBifFile1(input) {
  var input = document.getElementById("input1").innerHTML;
  console.log(input);
  downloadBinaryData(input, bifHeaderByteRange, parseBifHeader);
}

function playBifFile2(input) {
  var input = document.getElementById("input2").innerHTML;
  console.log(input);
  downloadBinaryData(input, bifHeaderByteRange, parseBifHeader);
}

function strToByteArray(str) {
  var bufView = new Uint8Array(str.length);
  for (var i=0, strLen=str.length; i<strLen; i++) {
   bufView[i] = (str.charCodeAt(i) & 0xFF) >>> 0;
  }
  return bufView;
  // var byteArray = new Uint8Array(str);
  // return byteArray;
  // var blob = new Blob([str], {type: "image/png"});
  // return blob;
}

function downloadBinaryData(input, byterange, callback) {
  console.log("downloading", byterange, "in", input);
  jQuery.ajax({
    url: input,
    type: 'GET',
    dataType: 'binary',
    processData: false,
    headers: {Range: byterange},
    responseType: 'arraybuffer'
  }).done(function (buffer) {
    var outBuffer = new Uint8Array(buffer);
    console.log("downloaded", outBuffer.length, "bytes");
    callback(outBuffer, input);
  });
}

function downloadString(input, byterange, callback) {
  console.log("downloading", byterange, "in", input);
  jQuery.ajax({
    url: input,
    type: 'GET',
    dataType: 'text',
    headers: {Range: byterange},
  }).done(function (buffer) {
    console.log("downloaded", buffer.length, "bytes");
    callback(buffer, input);
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

function parseBifHeader(header, input) {
  // var header = strToByteArray(buffer);
  // for( var i =0; i < header.length; i++) {
  //   console.log(ConvertBase.dec2hex(header[i]));
  // }

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

  downloadBinaryData(input, bifIndexByteRange, parseBifIndexHeader);
}

function parseBifIndexHeader(header, input){
  // var header = strToByteArray(buffer);
  var indexLength = header.length;
  var numFrames = indexLength / 8;
  var timeStamp = new Uint32Array(numFrames);
  var byteOffset = new Uint32Array(numFrames);
  for (var i = 0, j = 0; i < indexLength; j++, i = i+8) {
    timeStamp[j] = readUint32(header, i);
    byteOffset[j] = readUint32(header, i+4);
    if (j < 2) {
      console.log("Frame", j, "timeStamp", timeStamp[j], "byteOffset", byteOffset[j]);
    }
  }

  for( var i = 0; i < numFrames-1; i++) {
    var frameByteRange = "bytes=" + byteOffset[i] + "-" + (byteOffset[i+1] - 1);
    downloadBinaryData(input, frameByteRange, renderImage);
  }
}

function hexToBase64(str) {
    return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
}

function renderImage(header, input) {
  // for( var i =0; i < 10; i++) {
  //   console.log(ConvertBase.dec2hex(header[i]));
  // }
  // console.log('...')
  // for( var i =header.length-10; i < header.length; i++) {
  //   console.log(ConvertBase.dec2hex(header[i]));
  // }
  var img = document.createElement('img');
  img.src = 'data:image/jpeg;base64,' + btoa(ab2str(header));
  document.body.appendChild(img);
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, buf);
}


function redirect()
{
    window.location.href = "mailto:satheesh.ram@gmail.com";
}
