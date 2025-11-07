#!/bin/bash
set -e

echo "=== Deploying Application to K3s ==="

# Apply namespace first
echo "Creating namespace..."
kubectl apply -f k8s/00-namespace.yaml

# Apply configurations
echo "Applying configurations..."
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml

# Apply database
echo "Deploying database..."
kubectl apply -f k8s/10-database.yaml

# Wait for database to be ready
echo "Waiting for database to be ready..."
kubectl wait --for=condition=ready --timeout=300s pod/db-0 -n namelist

# Apply API
echo "Deploying API..."
kubectl apply -f k8s/20-api.yaml

# Apply Web frontend
echo "Deploying web frontend..."
kubectl apply -f k8s/30-web.yaml

# Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s \
  deployment/api deployment/web -n namelist

# Apply ingress
echo "Configuring ingress..."
kubectl apply -f k8s/40-ingress.yaml

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Application status:"
kubectl get pods -n namelist -o wide
echo ""
echo "Services:"
kubectl get svc -n namelist
echo ""
echo "Ingress:"
kubectl get ingress -n namelist
echo ""
echo "Access your application at: http://localhost"
