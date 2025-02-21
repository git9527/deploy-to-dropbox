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

function uploadMuhFile(filePath: string, dbx: any): Promise<any> {
  const fileContent = fs.readFileSync(filePath)
  const destinationPath = `${dropboxPathPrefix}${filePath}`
  // random delay to avoid rate limiting
  const delay = Math.floor(Math.random() * 1000)
  if (isDebug) console.log('delaying for: ', delay)
  console.log(`uploading file from ${filePath} to Dropbox: ${destinationPath}`)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dbx
        .filesUpload({path: destinationPath, contents: fileContent})
        .then((response: DropboxResponse<FileMetadata>) => {
          if (isDebug) console.log(response)
          if (response.status !== 200) {
            core.setFailed('File upload failed', response)
          }
          return response
        })
        .catch((error: any) => {
          console.error('Error uploading file:' + filePath, error)
          core.setfailed('Error uploading file', error)
          return error
        }))
    }, delay)
  })
}

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  const data = await response.json()
  return data.access_token  // 返回新的 access token
}

glob(globSource, {}, async (err: any, files: string[]) => {
  if (err) core.setFailed('Error: glob failed', err)
  const accessToken = await refreshAccessToken(refreshToken, clientId, clientSecret)
  console.log('access token refreshed:', accessToken)
  const dbx = new Dropbox({accessToken: accessToken})
  for (const file of files) {
    await uploadMuhFile(file, dbx)
  }
  console.log('all files have been uploaded')
})
