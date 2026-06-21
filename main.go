package main

import "github.com/TripleAze/chainguard/cmd"

var version string

func main() {
	cmd.Version = version
	cmd.Execute()
}
