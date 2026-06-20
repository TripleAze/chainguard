#!/bin/bash
set -e

echo "🧹 Cleaning up Kubernetes resources first to avoid dangling AWS resources..."

# Delete workloads first to release AWS resources like ALBs or EBS volumes
# If these aren't deleted first, Terraform might hang trying to delete the VPC.
kubectl delete -f deploy/deployment.yml --ignore-not-found=true || true

if [ -f "argocd/application.yml" ]; then
  kubectl delete -f argocd/application.yml --ignore-not-found=true || true
fi

kubectl delete -k policy/kyverno/ --ignore-not-found=true || true

echo "🔥 Destroying Terraform infrastructure..."
cd infra/terraform
terraform destroy -var-file=chainguard.tfvars -auto-approve

echo "✅ Destroy complete! You can seamlessly run ./startup.sh to provision everything again."
