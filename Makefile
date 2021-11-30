SHELL := bash
.SECONDEXPANSION:
.DELETE_ON_ERROR:

export ROOT := $(shell git rev-parse --show-toplevel)
export PATH := $(ROOT)/bin:$(PATH)

include Config.mk

#------------------------------------------------------------------------------
# Makefile variables defined here:
#------------------------------------------------------------------------------

BUILD := build
SITE := site
EXT := external
BPAN := .bpan
COMMON := ../yaml-common

include $(EXT)/ext.mk

BASEURL ?=
serve : BASEURL :=

PUBLISH_CNAME := play.yaml.io
REMOTE_NAME ?= origin

DOCKER_SHELL_CMD ?= bash

JEKYLL_BUILD := jekyll build --trace
JEKYLL_SERVE := jekyll serve --host 0.0.0.0
HISTORY_FILE := /tmp/docker-bash_history

SANDBOX_PORT ?= 1337
SANDBOX_IMAGE := yamlio/yaml-play-sandbox:$(SANDBOX_VERSION)
SANDBOX_RUN := \
  docker run --rm -d -p $(SANDBOX_PORT):$(SANDBOX_PORT) $(SANDBOX_IMAGE) http

#------------------------------------------------------------------------------
# Gather all the build files:
#------------------------------------------------------------------------------

FILES := \
    _config.yml \
    favicon.svg \
    Gemfile \
    $(EXT_FILES) \
    jekyll/_includes/sitedir-pulldown.html \

FILES := $(FILES:%.swp=)


#------------------------------------------------------------------------------
# Makefile rules start here:
#------------------------------------------------------------------------------
.PHONY: build site

list-files:
	@printf "%s\n" $(FILES)

files: $(EXT_DIRS) $(FILES) track-gh-pages

build: files
	jekyll-runner $(JEKYLL_BUILD)
ifneq (,$(SITEDIR))
ifneq (main,$(SITEDIR))
	mv $(BUILD)/main $(BUILD)/$(SITEDIR)
endif
endif

site: build
	git worktree add -f $@ gh-pages
	git -C $(SITE) reset --hard origin/gh-pages
	cd $(BUILD) && find . | grep -v Gemfile | cpio -dump ../$(SITE)
	echo $(PUBLISH_CNAME) > $(SITE)/CNAME
	touch $(SITE)/.nojekyll

serve: files
	$(eval override DOCKER_CID = $(shell $(SANDBOX_RUN)))
	RUN_OR_DOCKER_OPTIONS='--publish 4000:4000' \
	  jekyll-runner $(JEKYLL_SERVE)
	docker kill $(DOCKER_CID)

shell: files
	RUN_OR_DOCKER_OPTIONS='--volume $(HISTORY_FILE):/home/jekyll/.bash_history' \
	jekyll-runner $(DOCKER_SHELL_CMD)

publish: check-publish site
	@(set -x ; \
	  git -C $(SITE) add -A . && \
	  git -C $(SITE) commit --allow-empty -m 'Publish' && \
	  git -C $(SITE) push -f $(REMOTE_NAME) gh-pages )
	@echo
	@echo "Published: https://$(PUBLISH_CNAME)/$(SITEDIR)"
	@echo

push: docker-push

shell: docker-shell

docker-build docker-push docker-shell:
	$(MAKE) -C docker $@

# Remove generated files to force rebuild:
force:
	rm -fr ext $(BUILD) $(SITE) $(FILES)

common:
	cp $(COMMON)/bpan/run-or-docker.bash $(BPAN)/

clean: force
	$(MAKE) -C $(EXT) $@

clean-all:
	$(MAKE) -C .. clean

#------------------------------------------------------------------------------
_config.yml: jekyll/_config.yml
	@mkdir -p $(dir $@)
	cp $< $@
	echo >> $@
	echo '# Added by build system:' >> $@
	echo "baseurl: '$(BASEURL)'" >> $@
	echo "sandbox_version: '$(SANDBOX_VERSION)'" >> $@

favicon.svg: $(EXT)/yaml-common/image/yaml-logo.svg
	cp $< $@

$(EXT_DIRS):
	$(MAKE) -C $(EXT) build

ext/%: $(EXT)/%
	@mkdir -p $(dir $@)
	cp $< $@

ext/%/: $(EXT)/%
	mkdir -p $(shell dirname $@)
	cp -r $< $(shell dirname $@)

ext/%.coffee: $(EXT)/%.coffee
	@mkdir -p $(dir $@)
	(echo '---'; echo '---'; cat $<) > $@

ext/%.scss: $(EXT)/%.scss
	@mkdir -p $(dir $@)
	(echo '---'; echo '---'; cat $<) > $@

Gemfile:
	touch $@

jekyll/_includes/sitedir-pulldown.html:
	./bin/generate-sitedir-pulldown > $@

#------------------------------------------------------------------------------
check-publish:
ifeq ($(SITEDIR),)
	$(error Please set SITEDIR=<word>)
endif
ifneq ($(wildcard $(SITE)),)
	$(error Please make clean before make publish)
endif
ifeq ($(SITEDIR),main)
ifneq ($(shell git rev-parse --abbrev-ref HEAD), main)
	$(error Must be on branch main to use SITEDIR=main)
endif
endif

track-gh-pages:
	git show-ref -q origin/gh-pages || \
	  git fetch origin gh-pages
	-git branch --track gh-pages origin/gh-pages
