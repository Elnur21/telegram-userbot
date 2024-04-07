const { Stream } = require("stream")
const sharp = require("sharp")
const ffmpeg = require("fluent-ffmpeg")

const tmp = require('tmp')
const fs = require('fs')
const path = require("path")

const getDuration = async input => {
  return new Promise(( resolve, reject ) => {
    ffmpeg
      .ffprobe(input, ( err, data ) => {
        if ( err ) reject(err)
        else resolve(data.format.duration)
      })
  })
}

const videoToWebm = async input => {
  let fileType = await import('file-type')
  let fileInfo = await fileType.fileTypeFromBuffer(input)

  let filePath = ''
  let fileName = new Date().getTime() + `.${ fileInfo.ext }`

  let {
    name: dirName,
    removeCallback: deleteTmpDirectory } = tmp.dirSync()

  filePath = path.join(dirName, fileName)
  fs.writeFileSync(filePath, input)

  let fileSize = 256 //kb
  let duration = await getDuration(filePath)
  let bitrates = Math.round((fileSize * 8) / duration)

  return new Promise(( resolve, reject ) => {
    let buffers = []
    let streams = new Stream.PassThrough()

    ffmpeg()
      .addOption(['-y'])
      .input(filePath)
      .videoCodec('libvpx-vp9')
      .videoBitrate(bitrates, true)
      .addOption(['-pass', '1'])
      .noAudio()
      .toFormat('null')
      .size('512x512')
      .duration('0:3')
      .fpsOutput(30)
      .on('error', err => reject(err))
      .on('end', () => {
        ffmpeg()
          .input(filePath)
          .videoCodec('libvpx-vp9')
          .videoBitrate(bitrates, true)
          .addOption(['-pass', '2'])
          .noAudio()
          .toFormat('webm')
          .size('512x512')
          .duration('0:3')
          .fpsOutput(30)
          .on('error', err => reject(err))
          .writeToStream(streams, { end: true })
      })
      .saveToFile('/dev/null')

    streams
      .on('data', buf => buffers.push(buf))
      .on('error', err => reject(err))
      .on('end', () => {
        fs.rmSync(filePath)
        deleteTmpDirectory()

        let res = Buffer.concat(buffers)
        if ( res.length ) {
          resolve(res)
        }
      })
  })
}

const imageToPng = async input => {
  return new Promise(( resolve, reject ) => {
    sharp(input)
      .resize({ width: 512, height: 512 })
      .png({ quality: 100 })
      .toBuffer()
      .then( res => resolve(res) )
      .catch( err => reject(err) )
  })
}

module.exports = {
  videoToWebm,
  imageToPng
}
