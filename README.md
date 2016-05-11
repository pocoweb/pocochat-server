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

`cp env_template .env` will do the local trick for you.


## Run

```
$ mongodb-runner start
$ npm start
```

## Test

Registration, Login, Chat

```
open http://localhost:1337/public/chat.html
```

## Debug

## Deploy
