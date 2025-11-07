#!/bin/bash
set -e

echo "=== K3s Cleanup ==="
echo ""

# Delete application resources
echo "Deleting application resources..."
kubectl delete -f k8s/ --ignore-not-found=true

# Wait for cleanup
echo "Waiting for pods to terminate..."
sleep 5

# Check if anything is left
REMAINING=$(kubectl get pods -n namelist --no-headers 2>/dev/null | wc -l)
if [ "$REMAINING" -eq 0 ]; then
    echo "✅ All pods terminated"
else
    echo "⚠️  $REMAINING pods still terminating..."
fi

echo ""
echo "Application cleaned up. Cluster still running."
echo ""
echo "To delete the k3d cluster completely, run:"
echo "  k3d cluster delete namelist"
echo ""

# Optional: Prompt to delete cluster
read -p "Delete k3d cluster? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    k3d cluster delete namelist
    echo "✅ Cluster deleted"
else
    echo "Cluster preserved. Stop it with: k3d cluster stop namelist"
fi
