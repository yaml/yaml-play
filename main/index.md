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
Docker makes this trivial to do.

The playground will inform you when you need to run Docker, but we'll cover it
here.

Assuming you have
<a href="https://docs.docker.com/get-docker/" target="_blank">Docker installed</a>,
just run this command from a terminal:

```
docker run --rm -d -p 31337:31337 yamlio/yaml-play-sandbox:{{site.sandbox_version}} 31337
```

This will start a local YAML Playground Sandbox Server, and your playgrounds
will be able to work with them.

The sandbox web server (Python Flask) uses https and has a self-signed
certificate.
You'll need to approve it with your browser after you start the server.

Simply click
<a href="https://0.0.0.0:31337" target="_blank">https://0.0.0.0:31337</a>
and follow the browser instructions to allow it.

After that, reload the playground page and everything should work as planned.


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

Your local playground will be served at
<a href="http://0.0.0.0:4000/main/" target="_blank">http://0.0.0.0:4000/main/</a>

The `make serve` command will automatically start the right docker container
for you.
It will also kill that container when you kill the local server (ctl-C).

Since the local playground uses plain http, there is no certificate to approve.
