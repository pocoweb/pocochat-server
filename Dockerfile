FROM node:latest

RUN mkdir parse

COPY . /parse
WORKDIR /parse
#RUN npm --registry=https://registry.npm.taobao.org install
RUN npm config set proxy http://172.17.0.1:1081
RUN npm config set https-proxy http://172.17.0.1:1081
RUN npm install

COPY ./cloud/ /parse

#ENV APP_ID setYourAppId
#ENV MASTER_KEY setYourMasterKey
#ENV DATABASE_URI setMongoDBURI

# Optional (default : 'parse/cloud/main.js')
# ENV CLOUD_CODE_MAIN cloudCodePath

# Optional (default : '/parse')
# ENV PARSE_MOUNT mountPath

EXPOSE 11337

# Uncomment if you want to access cloud code outside of your container
# A main.js file must be present, if not Parse will not start

# VOLUME /parse/cloud               

CMD [ "npm", "startdocker" ]
