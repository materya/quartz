#!make

PM = npm
RM = rm

PRERELEASE_TAG ?= beta
PUBLISH_FLAGS = publish --access public

MODULES = node_modules
DIST = dist
COVERAGE = .nyc_output coverage

.PHONY: all
all: clean $(DIST)

$(MODULES):
	$(PM) i

$(DIST): $(MODULES)
	$(PM) run build

.PHONY: clean
clean:
	$(RM) -rf $(DIST) $(COVERAGE)

.PHONY: clean-all
clean-all:
	$(RM) -rf $(MODULES)

.PHONY: test
test:
	$(PM) t

coverage:
	$(PM) run coverage

.PHONY: release
release: $(DIST)
ifneq (,$(findstring n,$(MAKEFLAGS)))
	+$(PM) run release -- --dry-run
	+$(PM) $(PUBLISH_FLAGS) --dry-run
else
	$(PM) run release
	git push --follow-tags origin master
	$(PM) $(PUBLISH_FLAGS)
endif

.PHONY: prerelease
prerelease: $(DIST)
	$(PM) run release -- --prerelease $(PRERELEASE_TAG)
	git push --follow-tags origin master
	$(PM) $(PUBLISH_FLAGS) --tag prerelease
