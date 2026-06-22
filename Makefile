BINARY      := chaincheck
VERSION     := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
LDFLAGS     := -ldflags "-X github.com/TripleAze/chainguard/cmd.Version=$(VERSION) -s -w"
INSTALL_DIR := /usr/local/bin

.PHONY: build install uninstall test lint clean demo release-dry-run help

## build: compile the binary for the current OS/arch
build:
	go build $(LDFLAGS) -o $(BINARY) ./cmd/chaincheck

## install: build and install chaincheck to /usr/local/bin (requires sudo on most systems)
install: build
	@echo "Installing $(BINARY) to $(INSTALL_DIR)..."
	@install -m 755 $(BINARY) $(INSTALL_DIR)/$(BINARY)
	@echo "✅ chaincheck installed — run: chaincheck inspect <image>"

## uninstall: remove chaincheck from /usr/local/bin
uninstall:
	@rm -f $(INSTALL_DIR)/$(BINARY)
	@echo "🗑  chaincheck removed from $(INSTALL_DIR)"

## test: run all tests
test:
	go test ./... -v -count=1

## lint: run golangci-lint
lint:
	golangci-lint run ./...

## clean: remove local binary
clean:
	rm -f $(BINARY)

## demo: run chaincheck against the ChainGuard image
demo: build
	./$(BINARY) inspect ghcr.io/tripleaze/chainguard:main

## release-dry-run: test GoReleaser config without publishing
release-dry-run:
	goreleaser release --snapshot --clean

## help: print this help message
help:
	@echo "chaincheck build targets:"
	@sed -n 's/^## //p' $(MAKEFILE_LIST) | column -t -s ':' | sed -e 's/^/  /'
