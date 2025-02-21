import {DropboxResponse, files} from 'dropbox'
import FileMetadata = files.FileMetadata

const Dropbox = require('dropbox').Dropbox
const fs = require('fs')
const core = require('@actions/core')
const glob = require('glob')

const refreshToken = core.getInput('DROPBOX_REFRESH_TOKEN')
const clientId = core.getInput('DROPBOX_APP_KEY')
const clientSecret = core.getInput('DROPBOX_APP_SECRET')
const globSource = core.getInput('GLOB')
const dropboxPathPrefix = core.getInput('DROPBOX_DESTINATION_PATH_PREFIX')
const isDebug = core.getInput('DEBUG')
const dropbox = new Dropbox({refreshToken: refreshToken, clientId: clientId, clientSecret: clientSecret})

function uploadMuhFile(filePath: string): Promise<any> {
  const file = fs.readFileSync(filePath)
  const destinationPath = `${dropboxPathPrefix}${filePath}`
  // random delay to avoid rate limiting
  const delay = Math.floor(Math.random() * 1000)
  if (isDebug) console.log('delaying for: ', delay)
  console.log(`uploading file from ${file} to Dropbox: ${destinationPath}`)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dropbox
        .filesUpload({path: destinationPath, contents: file})
        .then((response: DropboxResponse<FileMetadata>) => {
          if (isDebug) console.log(response)
          if (response.status !== 200) {
            core.setFailed('File upload failed', response)
          }
          return response
        })
        .catch((error: any) => {
          if (isDebug) console.error(error)
          return error
        }))
    }, delay)
  })
}

glob(globSource, {}, (err: any, files: string[]) => {
  if (err) core.setFailed('Error: glob failed', err)
  Promise.all(files.map(uploadMuhFile))
    .then((all) => {
      console.log('all files uploaded', all)
    })
    .catch((err) => {
      core.setFailed('update error', err)
    })
})
