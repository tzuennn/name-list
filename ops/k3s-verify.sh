#!/bin/bash
set -e

echo "=== Verifying K3s Deployment ==="
echo ""

# Check cluster health
echo "1. Cluster Nodes:"
kubectl get nodes -o wide
echo ""

# Check namespace
echo "2. Namespace:"
kubectl get namespace namelist
echo ""

# Check pods
echo "3. Pods Status:"
kubectl get pods -n namelist -o wide
echo ""

# Check services
echo "4. Services:"
kubectl get svc -n namelist
echo ""

# Check ingress
echo "5. Ingress:"
kubectl get ingress -n namelist
echo ""

# Check pod placement
echo "6. Pod Placement Verification:"
echo "Database should be on agent node:"
kubectl get pod db-0 -n namelist -o wide | grep -i agent && echo "✅ Database on agent node" || echo "❌ Database NOT on agent node"
echo ""

# Test health endpoint
echo "7. Testing API Health:"
if curl -sf http://localhost/healthz > /dev/null; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
fi
echo ""

# Test names endpoint
echo "8. Testing Names API:"
if curl -sf http://localhost/api/names > /dev/null; then
    echo "✅ Names API accessible"
    echo "Sample data:"
    curl -s http://localhost/api/names | head -n 10
else
    echo "❌ Names API failed"
fi
echo ""

# Test web frontend
echo "9. Testing Web Frontend:"
if curl -sf http://localhost > /dev/null; then
    echo "✅ Web frontend accessible"
else
    echo "❌ Web frontend failed"
fi
echo ""

# Check resource usage
echo "10. Resource Usage:"
kubectl top nodes 2>/dev/null || echo "Metrics server not available (optional)"
echo ""

echo "=== Verification Complete ==="
