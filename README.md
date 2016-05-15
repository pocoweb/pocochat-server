# pocoweb-chat-server

This server based on https://github.com/ParsePlatform/parse-server-example

And all the information in README_original.md should be still valid. 


## Quickstart

```
$ npm install -g parse-server mongodb-runner
$ mongodb-runner start
```

Because we enabled LiveQuery in pocoweb-chat-server, so default `npm` installed `parse-server` will not work with Web Socket.

So firstly make the dotenv available. 

```
cp env_template .env
```

Secondly, uncomment variables you want to change, expecially `APPLICATION_ID` and `REST_API_KEY`.

Then, run the server:

```
$ npm start
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
