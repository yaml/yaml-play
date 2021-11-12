DOCKER_DIRS := \
    python \
    main

CLEAN_TARGETS := $(DOCKER_BUILD:%=clean-%)


docker-build: $(DOCKER_DIRS)

docker-push docker-shell: docker-build
	$(MAKE) -C main $@

clean:: $(CLEAN_TARGETS)

$(DOCKER_DIRS): force
	$(MAKE) -C $@ docker-build

clean-%: %/
	$(MAKE) -C $< clean

force:
