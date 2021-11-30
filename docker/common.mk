SHELL := bash
.SECONDEXPANSION:
.DELETE_ON_ERROR:

export ROOT := $(shell git rev-parse --show-toplevel)
export PATH := $(ROOT)/bin:$(PATH)

DOCKER_NS ?= yamlio
DOCKER_IMAGE := $(DOCKER_NS)/$(DOCKER_NAME):$(DOCKER_TAG)

include $(ROOT)/Config.mk

default:

clean::
ifdef DOCKER_DEPS
	rm -fr $(DOCKER_DEPS)
endif

docker-build:: $(DOCKER_DEPS)
	docker build \
	    --build-arg SANDBOX_VERSION=$(SANDBOX_VERSION) \
	    --build-arg RUNTIMES_VERSION=$(RUNTIMES_VERSION) \
	    -t $(DOCKER_IMAGE) \
	    .

docker-shell:: docker-build
	touch /tmp/docker-bash-history
	docker run -it --rm \
	    -v $(ROOT):/host \
	    -v /tmp/docker-bash-history:/root/.bash_history \
	    -w /host \
	    $(DOCKER_IMAGE) \
	    bash

docker-push:: docker-build
	docker push $(DOCKER_IMAGE)
