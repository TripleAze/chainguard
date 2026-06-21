BINARY := chaincheck
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
LDFLAGS := -ldflags "-X main.version=$(VERSION) -s -w"
INSTALL_DIR := /usr/local/bin

.PHONY: build install uninstall test lint clean demo

build:
	go build $(LDFLAGS) -o $(BINARY) .

# Installs to /usr/local/bin — works like cosign/crane/terraform
install: build
	install -m 755 $(BINARY) $(INSTALL_DIR)/$(BINARY)
	@echo "✅ chaincheck installed to $(INSTALL_DIR)/$(BINARY)"
	@echo "   Run: chaincheck inspect <image>"

uninstall:
	rm -f $(INSTALL_DIR)/$(BINARY)
	@echo "🗑  chaincheck removed from $(INSTALL_DIR)"

test:
	go test ./... -v

lint:
	golangci-lint run ./...

clean:
	rm -f $(BINARY)

demo:
	./$(BINARY) inspect ghcr.io/tripleaze/chainguard:main
