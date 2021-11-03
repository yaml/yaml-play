---
---
YAML Development Playgrounds
============================

Welcome to the playground area.
Here you'll find live demos of activity related to ongoing YAML language
development.

When you change values in the playgrounds, your changes are saved into the URL.
You can share your sessions with others just by sending them the URL.
This is a useful when reporting problems you come across.


## Playgrounds

* [YAML Parsers](parser)

  Compare YAML parsers in several programming languages.
  The non-JavaScript parsers require you to run a local Docker sandbox
  container.
  See below for details.

* [JavaScript](javascript)

  This playground compares only the JavaScript loaders.

<!--
* [Playground Development](devel)

  This is a playground that we use mostly for developing the playground
  functionality itself.
-->


## Setting up a Local Sandbox

YAML frameworks are implemented in many programming languages.
We want to be able to let you try all of them.
This means we need a backend server to run the code.

This, of course, has lots of security and hosting concerns.

The way we get around all that is to have you host the backend yourself!
Docker makes this trivial to do, and also assures that the only evil you can do
is to your own machine. :)

The playground will inform you when you need to run Docker, but we'll cover it
here.

Assuming you have [Docker installed](https://docs.docker.com/get-docker/), just
run this command from a terminal:

```
docker run --rm -d -p 31337:31337 yamlio/play-sandbox:0.0.8 https
```

This will start a local YAML Playground backend server, and your playgrounds
will be able to work with them.


### Required Browser Tweaks

Calling a localhost server from a web page breaks some browser security rules,
but it's pretty simple to work around them for this.

You'll need to open this URL one time:

* <https://localhost:31337>
* <http://localhost:1337> (for local `make serve`, see below)

and authorize the untrusted SSL certificate for it.

> Note: You should see the word `YAML` on the page if it works.

The other thing you need to do is allow JavaScript to "allow invalid
certificates for resources loaded from localhost".
So far, we have figured out how to do this on the Google Chrome and Firefox
browsers.

* Google Chrome (also works for Chromium)
  * Enable `chrome://flags/#allow-insecure-localhost`
  * Disable `chrome://flags/#block-insecure-private-network-requests`
    * Needed for local `make serve` server (see below)

* Firefox
  * Open the `about:config` URL
  * Search for `security.fileuri.strict_origin_policy` in the "Search preference
    name" box
  * Change value from `true` to `false`
  * Restart Firefox

That's everything.
You should be all set to use all the playground things that need to run
untrusted input on a server!

We'll keep looking for ways to make this simpler.
If you have ideas, let us know!


## Running the Playground Locally

If you are interested in toying around with the playground code yourself, it is
easy to make changes and run the server locally.
This might be useful if you want to submit a pull request to fix a bug or add a
feature.

To run this site locally all you need to do is:

```
$ git clone https://github.com/yaml/yaml-play
$ cd yaml-play
$ make serve
```

Your local playground will be served at <http://0.0.0.0:4000/main/>.
The `make serve` command will automatically start the right docker container
for you.
It will also kill that container when you kill the local server (ctl-C).
