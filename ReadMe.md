YAML Playground Website Generation
==================================

This directory is responsible for publishing the content of this (yaml-play)
repository to <https://play.yaml.io/>.

# Build System

Building, testing and publishing the website content is controlled by the
Makefile.
The Makefile supports:

* `make publish SITEDIR=...`

  Build and publish the content to <https://play.yaml.io/BRANCH>.

* `make serve`

  Build and serve locally to <http://0.0.0.0:4000/>.

* `make build`

  Build the site content into a finalized `./play.yaml.io/` directory.

* `make site`

  Gather the site content into the `./build/` Jekyll source directory.

* `make shell`

  Open a shell in the `github-pages` Docker container that builds the website
  content.

* `make force ...`

  The force rule will make sure everthing is rebuilt from scratch.

* `make clean`

  Remove generated files.

# Prerequisite Software

The build system uses various open source software.

## Required

At a minimum you'll need:

* `make`

  Of course.

* `bash`

  Required to be installed on your system.
  Not required to be the interactive shell you are using.

* `docker`

  Everything else is encapsulated in Docker images.
  If you have the required components installed locally they will be used,
  otherwise `docker` will be invoked.
  Docker is required for some complicated steps.

# Build Process

This system is made out of Markdown, YAML, SCSS and images.
It is currently using Jekyll to build the final result.

It gathers all the content in various directories throughout the repository and
puts them into the `./build/` directory in a standard Jekyll layout.

The intent is to not tie things too close to Jekyll or any other build system.

The Jekyll build system is captured in the `github-pages` Docker image.
It is the same build process that GitHub Pages uses when you push Jekyll
content to it.
It builds the final HTML/CSS/JavaScript into the `./play.yaml.io/` directory,
which is a worktree of the `gh-pages` branch.
When `make publish` pushes the `gh-pages` branch the content is served as
<https://play.yaml.io/>.
No further Jekyll processing happens on the GitHub side after pushing.
