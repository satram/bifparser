var bifParser = {

    fileSize :0,
    timeStamp: 0,
    frameStartOffset: 0,
    frameSize: 0,


    loadBifFile: function () {
        var selected_movie, dynamicUrl, bifHeaderByteRange,
            bifHeaderLength = 64;

        selected_movie = $('#movie :selected').text();
        console.log(selected_movie);

        dynamicUrl = 'http://' + window.location.hostname + ':' +
            window.location.port + '/api/images/' + selected_movie + '.bif'
        console.log(dynamicUrl)

        bifParser.getFileSize(dynamicUrl);

        bifHeaderByteRange = "bytes=0-" + (bifParser.bifHeaderLength - 1);
        bifParser.downloadBinaryData(
            dynamicUrl, bifHeaderByteRange, bifParser.parseHeader);
    },

    strToByteArray: function (str) {
        var byteArray, i;
        byteArray = new Uint8Array(str.length);
        for (i = 0, strLen = str.length; i < strLen; i++) {
            byteArray[i] = (str.charCodeAt(i) & 0xFF) >>> 0;
        }
        return byteArray;
    },

    downloadBinaryData: function (dynamicUrl, byterange, callback) {
        console.log("downloading", byterange, "in", dynamicUrl);
        jQuery.ajax({
            url: dynamicUrl,
            type: 'GET',
            dataType: 'binary',
            processData: false,
            headers: {Range: byterange},
            responseType: 'arraybuffer'
        }).done(function (buffer) {
            var outBuffer = new Uint8Array(buffer);
            console.log("downloaded", outBuffer.length, "bytes");
            callback(outBuffer, dynamicUrl);
        });
    },

    downloadString: function (dynamicUrl, byterange, callback) {
        console.log("downloading", byterange, "in", dynamicUrl);
        jQuery.ajax({
            url: dynamicUrl,
            type: 'GET',
            dataType: 'text',
            headers: {Range: byterange}
        }).done(function (buffer) {
            console.log("downloaded", buffer.length, "bytes");
            callback(buffer, dynamicUrl);
        });
    },

    getFileSize: function (dynamicUrl) {
        console.log("get filesize for ", dynamicUrl);
        var request = jQuery.ajax({
            url: dynamicUrl,
            type: 'HEAD',
            success: function () {
                bifParser.fileSize = request.getResponseHeader("Content-Length");
                console.log("filesize is", bifParser.fileSize);
            }
        });
    },

    scaleNum: function (num, pos) {
        var scaled = (num << (8 * pos)) >>> 0;
        return scaled;
    },

    readUint32: function (bytes, pos) {
        var result = bifParser.scaleNum(bytes[pos], 0) + bifParser.scaleNum(bytes[pos + 1], 1) +
            bifParser.scaleNum(bytes[pos + 2], 2) + bifParser.scaleNum(bytes[pos + 3], 3);
        return result;
    },

    parseHeader: function (header, dynamicUrl) {
        var version, numFrames, timeStampMultiplier, bifIndexLength, bifIndexByteRange;

        version = bifParser.readUint32(header, 8);
        console.log("version", version);

        numFrames = bifParser.readUint32(header, 12);
        console.log("numFrames", numFrames);

        timeStampMultiplier = bifParser.readUint32(header, 16);
        console.log("timeStampMultiplier", timeStampMultiplier);

        bifIndexLength = numFrames * 8;
        console.log("bifIndexLength", bifIndexLength);

        bifIndexByteRange = "bytes=64-" + (64 + bifIndexLength - 1);
        // console.log("bifIndexByteRange", bifIndexByteRange);

        bifParser.downloadBinaryData(dynamicUrl, bifIndexByteRange, bifParser.parseIndexTable);
    },

    parseIndexTable: function (header, dynamicUrl) {
        var indexLength, numFrames, i, j;

        indexLength = header.length;
        numFrames = indexLength / 8;
        bifParser.imeStamp = new Uint32Array(numFrames);
        bifParser.frameStartOffset = new Uint32Array(numFrames);
        bifParser.frameSize = new Uint32Array(numFrames);

        i = 0;
        j = 0;
        bifParser.imeStamp[j] = bifParser.readUint32(header, i);
        bifParser.frameStartOffset[j] = bifParser.readUint32(header, i + 4);
        i = i + 8; j++;
        for (; i < indexLength; j++, i = i + 8) {
            bifParser.imeStamp[j] = bifParser.readUint32(header, i);
            bifParser.frameStartOffset[j] = bifParser.readUint32(header, i + 4);
            bifParser.frameSize[j - 1] = bifParser.frameStartOffset[j] - bifParser.frameStartOffset[j - 1];
            console.log(
                "Frame", j - 1, "timeStamp", bifParser.timeStamp[j - 1],
                "frameStartOffset", bifParser.frameStartOffset[j - 1],
                "frameSize", bifParser.frameSize[j - 1]);
        }
        bifParser.frameSize[j - 1] = bifParser.fileSize - bifParser.frameStartOffset[j - 1];
        console.log(
            "Frame", j - 1, "timeStamp", bifParser.timeStamp[j - 1],
            "frameStartOffset", bifParser.frameStartOffset[j - 1],
            "frameSize", bifParser.frameSize[j - 1]);
    },

    playFile: function () {
        var selected_movie, dynamicUrl;

        selected_movie = $('#movie :selected').text();
        dynamicUrl = 'http://' + window.location.hostname + ':' +
            window.location.port + '/api/images/' + selected_movie + '.bif'
        _.each(bifParser.frameStartOffset, function (offset) {
            var frameIndex, frameByteRange;
            frameIndex = _.indexOf(bifParser.frameStartOffset, offset);
            frameByteRange = "bytes=" + offset + "-" +
                (offset + bifParser.frameSize[frameIndex] - 1);
            bifParser.downloadBinaryData(
                dynamicUrl, frameByteRange, bifParser.renderImage);
        });
    },

    hexToBase64: function (str) {
        return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
    },

    renderImage: function (header, dynamicUrl) {
        var img = document.createElement('img');
        img.src = 'data:image/jpeg;base64,' + btoa(bifParser.ab2str(header));
        document.body.appendChild(img);
    },

    ab2str: function (buf) {
        return String.fromCharCode.apply(null, buf);
    }
}

function redirect() {
    window.location.href = "mailto:satheesh.ram@gmail.com";
}
