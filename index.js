const Dropbox = require('dropbox').Dropbox
const fs = require('fs')
const core = require('@actions/core')
const glob = require('glob')
const path = require('path')

const refreshToken = core.getInput('DROPBOX_REFRESH_TOKEN')
const clientId = core.getInput('DROPBOX_APP_KEY')
const clientSecret = core.getInput('DROPBOX_APP_SECRET')
const globSource = core.getInput('GLOB_PATTERN')
const dropboxPathPrefix = core.getInput('DROPBOX_DESTINATION_PATH_PREFIX')
const dropboxUploadMode = core.getInput('DROPBOX_UPLOAD_MODE')
const isDebug = core.getBooleanInput('DEBUG')
const ignoreLocalPath = core.getBooleanInput('IGNORE_LOCAL_PATH')

function uploadMuhFile(filePath, dbx) {
  const fileContent = fs.readFileSync(filePath)
  let localFilePath = filePath
  if (ignoreLocalPath) {
    localFilePath = path.basename(filePath)
  }
  let remotePrefix = dropboxPathPrefix
  if (!remotePrefix.startsWith('/')) {
    console.log('remote prefix does start end with /, adding it')
    remotePrefix = '/' + remotePrefix
  }
  const destinationPath = `${remotePrefix}${localFilePath}`
  console.log(`uploading file from ${filePath} to Dropbox: ${destinationPath}`)
  return dbx
    .filesUpload({
      path: destinationPath,
      contents: fileContent,
      mode: {'.tag': dropboxUploadMode}
    })
    .then(response => {
      if (isDebug) console.log(response)
      if (response.status !== 200) {
        core.setFailed('File upload failed:' + response)
      }
      return response
    })
    .catch((error) => {
      console.error('Error uploading file:' + filePath, error)
      core.setFailed('Error uploading file' + error)
      return error
    })
}

async function refreshAccessToken(refreshToken, clientId, clientSecret) {
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

glob(globSource, {}, async (err, files) => {
  if (err) {
    console.error('Error globbing files:', err)
    core.setFailed('Error globbing files' + err)
  }
  console.log('files to be uploaded:', files)
  const accessToken = await refreshAccessToken(refreshToken, clientId, clientSecret)
  console.log('Successfully get access token:', accessToken)
  const dbx = new Dropbox({accessToken: accessToken})
  for (const file of files) {
    await uploadMuhFile(file, dbx)
  }
  console.log('All files uploaded successfully')
})
