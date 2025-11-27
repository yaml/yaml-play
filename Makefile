M := .cache/makes
$(shell [ -d $M ] || ( git clone -q https://github.com/makeplus/makes $M))

include $M/init.mk
include $M/node.mk
include $M/clean.mk

.SECONDEXPANSION:
.DELETE_ON_ERROR:

MAKES-REALCLEAN := \
  build/ \
  site/ \
  frontend/node_modules/ \
  frontend/dist/ \
  frontend/tsconfig*tsbuildinfo \
  frontend/vite.config.js \
  frontend/vite.config.d.ts \

override export ROOT := $(shell git rev-parse --show-toplevel)
override export PATH := $(ROOT)/bin:$(PATH)

include Config.mk

#------------------------------------------------------------------------------
# Variables
#------------------------------------------------------------------------------

BUILD := build
SITE := site
FRONTEND := frontend
NPM := $(NODE:node=npm)

PUBLISH_CNAME := play.yaml.com
REMOTE_NAME ?= origin

SANDBOX_PORT ?= 7481
SANDBOX_IMAGE := yamlio/yaml-play-sandbox:$(SANDBOX_VERSION)
SANDBOX_RUN := \
  docker run --rm -d -p \
    $(SANDBOX_PORT):$(SANDBOX_PORT) \
    $(SANDBOX_IMAGE) \
    $(SANDBOX_PORT)

#------------------------------------------------------------------------------
# Main targets
#------------------------------------------------------------------------------
.PHONY: build site serve

build: frontend-build
	rm -rf $(BUILD)
	cp -r $(FRONTEND)/dist $(BUILD)

serve: frontend-dev

site: build
	git worktree add -f $(SITE) gh-pages
	git -C $(SITE) reset --hard origin/gh-pages
	cp -r $(BUILD)/* $(SITE)/
	echo $(PUBLISH_CNAME) > $(SITE)/CNAME
	touch $(SITE)/.nojekyll

publish: site
	@( set -x; \
	  git -C $(SITE) add -A . && \
	  git -C $(SITE) commit --allow-empty -m 'Publish' && \
	  git -C $(SITE) push -f $(REMOTE_NAME) gh-pages )
	@echo
	@echo "Published: https://$(PUBLISH_CNAME)/"
	@echo

#------------------------------------------------------------------------------
# Reference parser
#------------------------------------------------------------------------------

REFPARSER_REPO := https://github.com/yaml/yaml-reference-parser
REFPARSER_DIR := .yaml-reference-parser
REFPARSER_JS := $(REFPARSER_DIR)/parser-1.2/javascript
REFPARSER_BUILD := $(REFPARSER_JS)/lib
REFPARSER_DEST := $(FRONTEND)/public/refparse

MAKES-REALCLEAN += $(REFPARSER_DIR) $(REFPARSER_DEST)

$(REFPARSER_DIR):
	git clone $(REFPARSER_REPO) $@

refparser-build: $(REFPARSER_DIR)
	$(MAKE) -C $(REFPARSER_JS) build
	mkdir -p $(REFPARSER_DEST)
	# Copy parser JS files
	cp $(REFPARSER_BUILD)/grammar.js $(REFPARSER_DEST)/
	cp $(REFPARSER_BUILD)/parser.js $(REFPARSER_DEST)/
	cp $(REFPARSER_BUILD)/receiver.js $(REFPARSER_DEST)/
	cp $(REFPARSER_BUILD)/test-receiver.js $(REFPARSER_DEST)/
	cp share/prelude.js $(REFPARSER_DEST)/
	# Remove require() calls from copied files for browser compatibility
	sed -i "s/require('.\/prelude');//g" $(REFPARSER_DEST)/*.js
	sed -i "s/require('.\/grammar');//g" $(REFPARSER_DEST)/*.js
	sed -i "s/require('.\/receiver');//g" $(REFPARSER_DEST)/*.js

refparser-test: $(REFPARSER_DIR)
	$(MAKE) -C $(REFPARSER_JS) yaml-parser <<<'[]'

#------------------------------------------------------------------------------
# Frontend (React) targets
#------------------------------------------------------------------------------

frontend-deps: $(NODE)
	cd $(FRONTEND) && $(NPM) install

frontend-dev: frontend-deps refparser-build
	$(eval override DOCKER_CID := $$(shell $$(SANDBOX_RUN)))
	cd $(FRONTEND) && $(NPM) run dev; \
	docker kill $(DOCKER_CID)

frontend-build: frontend-deps refparser-build
	cd $(FRONTEND) && $(NPM) run build

#------------------------------------------------------------------------------
# Docker targets
#------------------------------------------------------------------------------

no-docker:
	$(eval override SANDBOX_RUN := true)

push: docker-push

docker-build docker-push docker-shell:
	$(MAKE) -C docker $@

#------------------------------------------------------------------------------
# Helpers
#------------------------------------------------------------------------------

track-gh-pages:
	git show-ref -q origin/gh-pages || \
	  git fetch origin gh-pages
	-git branch --track gh-pages origin/gh-pages
