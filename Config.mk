CONFIG_MK := $(ROOT)/../yaml-test-runtimes/Config.mk

ifneq (,$(wildcard $(CONFIG_MK)))
    include $(CONFIG_MK)
    RUNTIMES_VERSION := $(TAG_MAIN)
endif
ifneq (,$(RUNTIMES_VERSION))
    export RUNTIMES_VERSION
endif

SANDBOX_VERSION := $(RUNTIMES_VERSION)-C
