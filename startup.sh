#!/bin/bash
set -e

echo "Starting infrastructure provisioning..."
cd infra/terraform
terraform init
terraform apply -var-file=chainguard.tfvars -auto-approve

echo "Updating kubeconfig..."
# Assuming us-east-1 based on your tfvars
aws eks update-kubeconfig --region us-east-1 --name chainguard-eks

cd ../../


echo "Installing Kyverno..."
kubectl create -f https://github.com/kyverno/kyverno/releases/download/v1.11.4/install.yaml
sleep 20

echo "Applying Kyverno Policies..."
kubectl apply -k policy/kyverno/                

echo "Installing ArgoCD..."
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Deploying application workloads..."
kubectl apply -f deploy/deployment.yml

if [ -f "argocd/application.yml" ]; then
  echo "Deploying ArgoCD Application..."
  kubectl apply -f argocd/application.yml
fi

echo "Startup complete!"
