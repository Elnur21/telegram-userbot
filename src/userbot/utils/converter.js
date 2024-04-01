const { Stream } = require("stream")
const sharp = require("sharp")
const ffmpeg = require("fluent-ffmpeg")

const tmp = require('tmp')
const fs = require('fs')
const path = require("path")

const videoToWebm = async input => {
  let fileType = await import('file-type')
  let fileInfo = await fileType.fileTypeFromBuffer(input)

  let filePath = ''
  let fileName = new Date().getTime() + `.${ fileInfo.ext }`

  let {
    name: dirName,
    removeCallback } = tmp.dirSync()

  filePath = path.join(dirName, fileName)
  fs.writeFileSync(filePath, input)

  return new Promise(( resolve, reject ) => {
    let buffers = []
    let streams = new Stream.PassThrough()

    ffmpeg()
      .input(filePath)
      .fromFormat(fileInfo.ext)
      .toFormat('webm')
      .videoCodec('libvpx-vp9')
      .noAudio()
      .size('512x512')
      .duration('0:3')
      .fpsOutput(30)
      .on('error', err => reject(err))
      .writeToStream(streams, { end: true })

    streams
      .on('data', buf => buffers.push(buf))
      .on('error', err => reject(err))
      .on('end', () => {
        fs.rmSync(filePath)
        removeCallback()

        let output = Buffer.concat(buffers)
        if ( output.length ) resolve(output)
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
