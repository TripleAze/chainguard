#!/bin/bash
set -e

echo "applying argocd application..."

kubectl apply -f argocd/application.yml
sleep 10

echo "ArgoCD application applied successfully!"

echo "Deploying application workloads..."
kubectl apply -f deploy/dashboard-backend-secret.yml &&
kubectl apply -f deploy/dashboard-backend.yml &&
kubectl apply -f deploy/dashboard-db-secret.yml &&
kubectl apply -f deploy/dashboard-db.yml &&
kubectl apply -f deploy/dashboard-frontend.yml &&
kubectl apply -f deploy/dashboard-ingress.yml &&
kubectl apply -f deploy/service.yml
sleep 10

echo "Application workloads deployed successfully!"

echo "Startup complete!"

