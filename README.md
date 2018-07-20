# Media Compressor

Client-side: HTML, CSS, JavaScript, jQuery

Server-side: Node.js, Express

Demo here: https://juliarainto.com/apps/mediapakkaaja

## Start application

Start
```
npm install -g http-server
```
Server:
```
cd .\server
npm install
npm start
```
Client:
```
cd .\client
http-server
open browser to: http://localhost:8080
```
Build:
```
npm build
```
# Applications installation to webserver

This installation is tested to work on Ubuntu 16.04 system and Nginx software. 

## SYSTEM REQUIREMENTS AND RECOMMENDATIONS

Server should have at least 4GB RAM, so that the program will run smoothly.

Client folders files should all be minified.

Gzip is recommended to be installed on the server, to assure faster content loading.

Client folders main.js and video.js files that uses ECMAScript 6 should first be run through Babel (https://babeljs.io/repl), Choose only the following settings: 

* SETTINGS: Line Wrap and Minify

* PRESETS: es2015 and stage-2

## APPLICATION CONFIGURATION

To secure data travel SSL protocol is required. 

* Enable sslEnabled to true. These options can be found in server.js, main.js and vid-eo.js. Make sure all of them is set true. 

* Replace your own server URL to POST routes, your_address.com. Change these in server.js, main.js and video.js. Make sure all of them has the right URL. 

* SSL certificate path needs to be defined in server.js. Replace path: “/var/www/certs/” with your own path where your SSL certificates are located. 

## REQUIRED INSTALLATIONS

### NodeJS

Remove old Node.js:

```
sudo -i
apt-get remove nodered -y
apt-get remove nodejs nodejs-legacy -y
exit
```
Install n, that will install latest Node.js: 

```
curl -L https://git.io/n-install | bash
```
* Installation asks y/N, push y

* Installation asks at the end the following: IMPORTANT: OPEN A NEW TERMINAL TAB/WINDOW or run `. /root/.bashrc` before using n and Node.js. Write the following command: 

```
. /root/.bashrc
```

Verify that installation worked: 

```
node -v
npm -v
```
Node version should be v.10.6.0 (or the newest)
Npm version should be v.6.1.0 (or the newest)

### FFmpeg

Install FFmpeg: 

```
sudo apt-get install ffmpeg
```
### Babel

Install Babel

```
npm install -g babel-cli
```
### pm2

Install pm2: 

```
npm install pm2 -g
```

Run following command: 

```
pm2 startup
```

## WEB SERVER

If you don’t have web server installed follow these steps, otherwise skip to web server configuration.

Install nginx: 

```
sudo apt-get install nginx
```
Test if nginx works by going going to your URL address. 

### Web server configuration

Navigate to PATH: 

```
cd /var/www/html
```

Create new folder if needed using following command and replacing apps with the desired folder name: 

```
sudo mkdir apps
```

Give the following PATH: cd /var/www/html Read/Write permissions, using following command: 

```
sudo chmod -R 777 apps
```

## START APPLICATION

Insert Client- folder content to wanted PATH or the one created by nginx, using file transfer protocol (FTP).

Nginx example: 

```
cd /var/www/html/apps
```

At the server folder run the command `npm install` (Picture 19) and after that, run the pm2 command and replace mediacompressor with desired folder name: 

```
npm install 
pm2 start --watch --interpreter babel-cli server.js --name apps mediacompressor
```
After installation run command: 
```
pm2 save
```
Delete Read/Write permissions from the path: cd /var/www/html with following command: 

```
sudo chmod -R 755 apps
```

Navigate web-server URL where client-side was copied and the program should start.

