# aml-gdoc-server

FORK: Modified to read creds from an .env file for deploy to heroku. Very raw, just using this for personal needs.

This is a simple way to retrieve Google Docs written in the [ArchieML](http://archieml.org/) format as json for web apps.
It was created for the Quartz things team, which uses it as part of our build process to streamline the editing of our work.

## Installation

To install run

	npm install -g aml-gdoc-server

in your terminal shell

## Usage

To start the server run

	aml-gdoc-server
	
in your terminal shell

### On the first run

The first time you start the server it will prompt you to provide it with Google API credentials. You will be given instructions on securing those. These credentials and subsequent authorization tokens are saved in a hidden file at `~/.aml-gdoc-credentials` in json format

### On subsequent runs

After the one time setup procedures are completed, all future instances of the server will start immediately upon running `aml-gdoc-server` in your shell

### On all runs

The server defaults to port 6006 i.e. "Goog."

ArchieML formatted Google Docs can can be retrieved using this url structure `http://127.0.0.1:6006/{google-doc-key}`

