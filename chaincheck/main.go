package main

import "github.com/tripleaze/chaincheck/cmd"

var version string

func main() {
	cmd.Version = version
	cmd.Execute()
}
