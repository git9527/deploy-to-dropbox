# deploy-to-dropbox

A GitHub Action to deploy to Dropbox

## Generate the refresh token

Visit the following URI in your browser to get the authorization code.

```
https://www.dropbox.com/oauth2/authorize?client_id=${YOUR_APP_KEY}&response_type=code&token_access_type=offline
```

Then, we can get the refresh token by the following command. Please use the authorization code you have just got in the previous step in the browser.

```
$ curl https://api.dropbox.com/oauth2/token \
    -d code=${AUTHORIZATION_CODE} \
    -d grant_type=authorization_code \
    -d client_id=${YOUR_APP_KEY} \
    -d client_secret=${YOUR_APP_SECRET}
```

The response will be like the following.

```
{
    "access_token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "token_type": "bearer",
    "refresh_token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "account_id": "xxxxxxxxx",
    "uid": "xxxxxxxx"
}
```

Keep the `refresh_token` for later use.

## Set the secrets in the repository

Set the following secrets in the repository settings.

- `DROPBOX_APP_KEY`: The app key of the Dropbox app.
- `DROPBOX_APP_SECRET`: The app secret of the Dropbox app.
- `DROPBOX_REFRESH_TOKEN`: The refresh token of the Dropbox app.

## Usage

Now you are ready to upload the file to Dropbox with the following step in your workflow.

```yaml
  - name: Upload to Dropbox
    uses: git9527/deploy-to-dropbox@v1
    with:
      DROPBOX_REFRESH_TOKEN: ${{ secrets.DROPBOX_ACCESS_TOKEN }}
      DROPBOX_APP_KEY: ${{ secrets.DROPBOX_APP_KEY }}
      DROPBOX_APP_SECRET: ${{ secrets.DROPBOX_APP_SECRET }}
      GLOB: **/*
      DROPBOX_DESTINATION_PATH_PREFIX: <Your Dropbox folder path>
```