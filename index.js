#!/usr/bin/env node

const express = require('express');
const { google } = require('googleapis');
const { docToArchieML } = require('@newswire/doc-to-archieml');
const fs = require("fs");
const opn = require('opn');
const url = require("url");
require('dotenv').config();

const credentials = {
	client_id: process.env.CLIENT_ID,
	client_secret: process.env.CLIENT_SECRET,
	redirect_uris: process.env.REDIRECT_URIS.split(',')
}

var tokenpath = "./.aml-gdoc-tokens"
var tokens = {}
try {
	tokens = JSON.parse(fs.readFileSync(tokenpath, "utf8"));
} catch (e) { }

var HOST = "http://127.0.0.1";
var PORT = process.env.PORT || 6006;
// var BASE_URL = HOST + ":" + PORT;
var REDIRECT_PATH = "/auth";
var LOGIN_PATH = "/login";
// var REDIRECT_URL = BASE_URL + REDIRECT_PATH;

var oAuth2Client;
var drive;
var app = express();

var TOKEN;
var DOC_KEY;

const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

function saveConfig() {
	fs.writeFileSync(tokenpath, JSON.stringify(tokens, null, 4))
}

function timestamp() {
	return "[" + new Date().toISOString().split("T")[1] + "]";
}

async function updateToken(oA2C) {
	
	console.log(`${timestamp()} Updating access token`);

	oA2C.setCredentials({
		refresh_token: tokens.refresh_token
	});

	let t = await oA2C.getAccessToken();
	tokens = Object.assign(tokens, t.res.data);

	saveConfig();
}

function getNewToken(oA2C, callback) {
  const authUrl = oA2C.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('Please authorize the app in your browser');
  opn(authUrl, {wait: false}).then(cp => cp.unref());

}

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials;
  oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  	if(!("refresh_token" in tokens)) {
  		getNewToken(oAuth2Client);
  	}

	if(Date.now() > tokens.expiry_date) updateToken(oAuth2Client)

	oAuth2Client.setCredentials(tokens);
	callback(oAuth2Client);
}

app.get(REDIRECT_PATH, function(req, res) {
	console.log(`${timestamp()} GET ${REDIRECT_PATH}`);
	var code = url.parse(req.url, true).query.code;


	oAuth2Client.getToken(code, (err, token) => {
	  if (err) return res.send(`There was an error getting an access token\n{JSON.stringify(err, null, 4)}`);

	  oAuth2Client.setCredentials(token);
	  tokens = Object.assign(tokens, token);
	  saveConfig();

	  console.log(`${timestamp()} The app is now authorized`);
	  res.send("The app is now authorized!");

	});

});

app.get(LOGIN_PATH, function(req, res) {
	console.log(`${timestamp()} GET ${LOGIN_PATH}`);

	var redirect_url = oAuth2Client.generateAuthUrl({
	    access_type: 'offline',
	    scope: SCOPES,
	    approval_prompt:'force'
	});

	res.redirect(redirect_url);
});

app.get("/favicon.ico",function(req,res) {
	res.status(404).send("Not found");
});

app.get('/:key', function (req, res) {
	console.log(`${timestamp()} GET /${DOC_KEY}`);
	try {
		console.log(fs.statSync(tokenpath).mtime)
	} catch (e) { }

	if(Date.now() > tokens.expiry_date) updateToken(oAuth2Client);

	oAuth2Client.setCredentials(tokens);

	docToArchieML({ documentId: DOC_KEY, auth: oAuth2Client })
		.then(r => res.send(r), e => res.status(e.code || 500 ).send(e.response ? e.response.data.error : e))
		.catch(console.log);
	
});

app.param('key', function (req, res, next, key) {
  DOC_KEY = key || DOC_KEY;
  next();
});

function run() {
	var server = app.listen(PORT, function () {
		console.log(`${timestamp()} The aml-gdoc-server is up and listening at ${HOST}:${PORT}`);
	});

	authorize(credentials, ()=>{})
}

run()