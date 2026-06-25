# Build stage using Chainguard Go image
FROM cgr.dev/chainguard/go:latest as builder

# Set working directory
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the code
COPY . .

# Build the Go app as a static binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server main.go

# Final stage using Chainguard distroless static image
FROM cgr.dev/chainguard/static:latest

# Copy the static binary from builder
COPY --from=builder /app/server /server

# Set the entrypoint
ENTRYPOINT ["/server"]

# Expose port 8080
EXPOSE 8080
