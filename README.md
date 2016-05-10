# pocoweb-chat-server

This server based on https://github.com/ParsePlatform/parse-server-example

And all the information in README_original.md should be still valid. 


## Quickstart

```
$ npm install -g parse-server mongodb-runner
$ mongodb-runner start
$ parse-server --appId APPLICATION_ID --masterKey MASTER_KEY
```

## Install

With MongoDB

```
$ npm install -g mongodb-runner  # install globally
$ npm install
```

## Environment

The following variable could be recoganized from the shell environment.

```
DATABASE_URI or MONGODB_URI  # default 'mongodb://localhost:27017/dev'
CLOUD_CODE_MAIN  # default __dirname + '/cloud/main.js'
APPLICATION_ID  # default myAppId
REST_API_KEY  # Your master key and keep it secret
SERVER_URL  # 'http://localhost:1337/parse'
PARSE_MOUNT  # default /parse
PORT  # default 1337
```

## Run

```
$ mongodb-runner start
$ npm start
```

## Debug

## Deploy
