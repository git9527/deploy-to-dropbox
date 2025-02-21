var Dropbox = require('dropbox').Dropbox;
var fs = require('fs');
var core = require('@actions/core');
var glob = require('glob');
var refreshToken = core.getInput('DROPBOX_REFRESH_TOKEN');
var clientId = core.getInput('DROPBOX_APP_KEY');
var clientSecret = core.getInput('DROPBOX_APP_SECRET');
var globSource = core.getInput('GLOB');
var dropboxPathPrefix = core.getInput('DROPBOX_DESTINATION_PATH_PREFIX');
var isDebug = core.getInput('DEBUG');
var dropbox = new Dropbox({ refreshToken: refreshToken, clientId: clientId, clientSecret: clientSecret });
function uploadMuhFile(filePath) {
    var file = fs.readFileSync(filePath);
    var destinationPath = "" + dropboxPathPrefix + filePath;
    // random delay to avoid rate limiting
    var delay = Math.floor(Math.random() * 1000);
    if (isDebug)
        console.log('delaying for: ', delay);
    console.log("uploading file from " + file + " to Dropbox: " + destinationPath);
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(dropbox
                .filesUpload({ path: destinationPath, contents: file })
                .then(function (response) {
                if (isDebug)
                    console.log(response);
                if (response.status !== 200) {
                    core.setFailed('File upload failed', response);
                }
                return response;
            })
                .catch(function (error) {
                if (isDebug)
                    console.error(error);
                return error;
            }));
        }, delay);
    });
}
glob(globSource, {}, function (err, files) {
    if (err)
        core.setFailed('Error: glob failed', err);
    Promise.all(files.map(uploadMuhFile))
        .then(function (all) {
        console.log('all files uploaded', all);
    })
        .catch(function (err) {
        core.setFailed('update error', err);
    });
});
