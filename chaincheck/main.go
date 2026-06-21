package main

import "github.com/TripleAze/chainguard/chaincheck/cmd"

var version string

func main() {
	cmd.Version = version
	cmd.Execute()
}
