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

PUBLISH-CNAME := play.yaml.com
REMOTE-NAME ?= origin

SANDBOX-PORT ?= 7481
SANDBOX-IMAGE := yamlio/yaml-play-sandbox:$(SANDBOX-VERSION)
SANDBOX-RUN := \
  docker run --rm -d -p \
    $(SANDBOX-PORT):$(SANDBOX-PORT) \
    $(SANDBOX-IMAGE) \
    $(SANDBOX-PORT)

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
	echo $(PUBLISH-CNAME) > $(SITE)/CNAME
	touch $(SITE)/.nojekyll

publish: site
	@( set -x; \
	  git -C $(SITE) add -A . && \
	  git -C $(SITE) commit --allow-empty -m 'Publish' && \
	  git -C $(SITE) push -f $(REMOTE-NAME) gh-pages )
	@echo
	@echo "Published: https://$(PUBLISH-CNAME)/"
	@echo

#------------------------------------------------------------------------------
# Reference parser
#------------------------------------------------------------------------------

REFPARSER-REPO := https://github.com/yaml/yaml-reference-parser
REFPARSER-DIR := .yaml-reference-parser
REFPARSER-JS := $(REFPARSER-DIR)/parser-1.2/javascript
REFPARSER-BUILD := $(REFPARSER-JS)/lib
REFPARSER-DEST := $(FRONTEND)/public/refparse

MAKES-REALCLEAN += $(REFPARSER-DIR) $(REFPARSER-DEST)

$(REFPARSER-DIR):
	git clone $(REFPARSER-REPO) $@

refparser-build: $(REFPARSER-DIR)
	$(MAKE) -C $(REFPARSER-JS) build
	mkdir -p $(REFPARSER-DEST)
	# Copy parser JS files
	cp $(REFPARSER-BUILD)/grammar.js $(REFPARSER-DEST)/
	cp $(REFPARSER-BUILD)/parser.js $(REFPARSER-DEST)/
	cp $(REFPARSER-BUILD)/receiver.js $(REFPARSER-DEST)/
	cp $(REFPARSER-BUILD)/test-receiver.js $(REFPARSER-DEST)/
	cp share/prelude.js $(REFPARSER-DEST)/
	# Remove require() calls from copied files for browser compatibility
	sed -i "s/require('.\/prelude');//g" $(REFPARSER-DEST)/*.js
	sed -i "s/require('.\/grammar');//g" $(REFPARSER-DEST)/*.js
	sed -i "s/require('.\/receiver');//g" $(REFPARSER-DEST)/*.js

refparser-test: $(REFPARSER-DIR)
	$(MAKE) -C $(REFPARSER-JS) yaml-parser <<<'[]'

#------------------------------------------------------------------------------
# Frontend (React) targets
#------------------------------------------------------------------------------

frontend-deps: $(NODE)
	cd $(FRONTEND) && $(NPM) install

frontend-dev: frontend-deps refparser-build
	$(eval override DOCKER-CID := $$(shell $$(SANDBOX-RUN)))
	cd $(FRONTEND) && $(NPM) run dev; \
	docker kill $(DOCKER-CID)

frontend-build: frontend-deps refparser-build
	cd $(FRONTEND) && $(NPM) run build

#------------------------------------------------------------------------------
# Docker targets
#------------------------------------------------------------------------------

no-docker:
	$(eval override SANDBOX-RUN := true)

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
