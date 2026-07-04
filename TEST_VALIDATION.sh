#!/bin/bash

echo "========================================="
echo "Testing Input Validation & Error Handling"
echo "========================================="
echo ""

BASE_URL="http://localhost:5000"

echo "1. Testing valid opportunity request..."
curl -X POST $BASE_URL/api/v1/opportunities \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "pagination": 18, "role": "ai-engineer", "userType": "students"}' \
  -s -w "\nStatus: %{http_code}\n" | jq '.' 2>/dev/null || echo "Server not running or jq not installed"

echo ""
echo "----------------------------------------"
echo ""

echo "2. Testing invalid pagination (over limit)..."
curl -X POST $BASE_URL/api/v1/opportunities \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "pagination": 200}' \
  -s -w "\nStatus: %{http_code}\n" | jq '.' 2>/dev/null || echo "Server not running or jq not installed"

echo ""
echo "----------------------------------------"
echo ""

echo "3. Testing negative page number..."
curl -X POST $BASE_URL/api/v1/opportunities \
  -H "Content-Type: application/json" \
  -d '{"page": -1, "pagination": 18}' \
  -s -w "\nStatus: %{http_code}\n" | jq '.' 2>/dev/null || echo "Server not running or jq not installed"

echo ""
echo "----------------------------------------"
echo ""

echo "4. Testing missing required field (wishlist)..."
curl -X POST $BASE_URL/api/v1/wishlist \
  -H "Content-Type: application/json" \
  -d '{"user_id": "123"}' \
  -s -w "\nStatus: %{http_code}\n" | jq '.' 2>/dev/null || echo "Server not running or jq not installed"

echo ""
echo "----------------------------------------"
echo ""

echo "5. Testing 404 for undefined route..."
curl -X GET $BASE_URL/api/v1/nonexistent \
  -s -w "\nStatus: %{http_code}\n" | jq '.' 2>/dev/null || echo "Server not running or jq not installed"

echo ""
echo "========================================="
echo "Testing Complete!"
echo "========================================="
echo ""
echo "To run these tests:"
echo "1. Start the server: npm run dev"
echo "2. Run this script: bash TEST_VALIDATION.sh"
echo ""
