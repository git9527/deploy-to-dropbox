const Dropbox = require('dropbox').Dropbox
const fs = require('fs')
const core = require('@actions/core')
const glob = require('glob')

const refreshToken = core.getInput('DROPBOX_REFRESH_TOKEN')
const clientId = core.getInput('DROPBOX_APP_KEY')
const clientSecret = core.getInput('DROPBOX_APP_SECRET')
const globSource = core.getInput('GLOB_PATTERN')
const dropboxPathPrefix = core.getInput('DROPBOX_DESTINATION_PATH_PREFIX')
const dropboxUploadMode = core.getInput('DROPBOX_UPLOAD_MODE')
const isDebug = core.getInput('DEBUG')

function uploadMuhFile(filePath, dbx) {
  const fileContent = fs.readFileSync(filePath)
  const destinationPath = `${dropboxPathPrefix}${filePath}`
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
  Promise.all(files.map(file => uploadMuhFile(file, dbx)))
    .then(function (all) {
      console.log('all files uploaded', all);
    })
    .catch(function (err) {
      console.error('error', err);
      core.setFailed('Error uploading files:' + err)
    });
})
