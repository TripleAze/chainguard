package registry

import (
	"fmt"
	"os"

	"github.com/google/go-containerregistry/pkg/authn"
	"github.com/google/go-containerregistry/pkg/name"
	"github.com/google/go-containerregistry/pkg/v1/remote"
)

func ResolveDigest(imageRef string) (string, error) {
	ref, err := name.ParseReference(imageRef)
	if err != nil {
		return "", fmt.Errorf("invalid image reference: %w", err)
	}

	opts := []remote.Option{}
	if token := os.Getenv("CHAINCHECK_REGISTRY_TOKEN"); token != "" {
		opts = append(opts, remote.WithAuth(authn.FromConfig(authn.AuthConfig{RegistryToken: token})))
	}

	desc, err := remote.Get(ref, opts...)
	if err != nil {
		return "", fmt.Errorf("failed to get image: %w", err)
	}

	return desc.Digest.String(), nil
}

func ParseImageRef(imageRef string) (repo string, digest string, err error) {
	ref, err := name.ParseReference(imageRef)
	if err != nil {
		return "", "", fmt.Errorf("invalid image reference: %w", err)
	}

	if digestRef, ok := ref.(name.Digest); ok {
		return digestRef.Context().Name(), digestRef.DigestStr(), nil
	}

	tagRef, ok := ref.(name.Tag)
	if !ok {
		return "", "", fmt.Errorf("unexpected reference type")
	}

	opts := []remote.Option{}
	if token := os.Getenv("CHAINCHECK_REGISTRY_TOKEN"); token != "" {
		opts = append(opts, remote.WithAuth(authn.FromConfig(authn.AuthConfig{RegistryToken: token})))
	}

	desc, err := remote.Get(tagRef, opts...)
	if err != nil {
		return "", "", fmt.Errorf("failed to resolve tag to digest: %w", err)
	}

	return tagRef.Context().Name(), desc.Digest.String(), nil
}

func ResolveToDigest(imageRef string) (digestRef string, err error) {
	ref, err := name.ParseReference(imageRef)
	if err != nil {
		return "", fmt.Errorf("invalid image reference: %w", err)
	}

	if _, ok := ref.(name.Digest); ok {
		return imageRef, nil
	}

	tagRef, ok := ref.(name.Tag)
	if !ok {
		return "", fmt.Errorf("unexpected reference type")
	}

	opts := []remote.Option{}
	if token := os.Getenv("CHAINCHECK_REGISTRY_TOKEN"); token != "" {
		opts = append(opts, remote.WithAuth(authn.FromConfig(authn.AuthConfig{RegistryToken: token})))
	}

	desc, err := remote.Get(tagRef, opts...)
	if err != nil {
		return "", fmt.Errorf("failed to resolve tag to digest: %w", err)
	}

	return fmt.Sprintf("%s@%s", tagRef.Context().Name(), desc.Digest.String()), nil
}
