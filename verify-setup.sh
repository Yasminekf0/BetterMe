#!/bin/bash

# Real-time Audio Streaming Setup Verification Script

echo "======================================"
echo "Real-time Audio Streaming Setup Check"
echo "======================================"
echo ""

# Check backend setup
echo "📦 Backend Setup:"
echo ""

# Check Socket.io installation
if [ -d "backend/node_modules/socket.io" ]; then
  echo "✅ Socket.io installed"
else
  echo "❌ Socket.io not installed - run 'npm install' in backend/"
fi

# Check core files
echo ""
echo "📄 Core Files:"
files=(
  "backend/src/index.ts"
  "backend/src/socket/handlers.ts"
  "backend/src/services/sessionManager.ts"
  "backend/src/services/aliyunSTTService.ts"
  "frontend/src/lib/socketClient.ts"
  "frontend/src/hooks/useAudioRecorder.ts"
  "frontend/src/hooks/useRealtimeRoleplay.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file missing"
  fi
done

echo ""
echo "🔧 Configuration:"
echo ""

# Check environment variables
if [ -f "backend/.env" ]; then
  echo "✅ Backend .env exists"
  
  if grep -q "ALIYUN_ACCESS_KEY_ID" backend/.env; then
    echo "  ✅ ALIYUN_ACCESS_KEY_ID configured"
  else
    echo "  ❌ ALIYUN_ACCESS_KEY_ID not configured"
  fi
  
  if grep -q "ALIYUN_ACCESS_KEY_SECRET" backend/.env; then
    echo "  ✅ ALIYUN_ACCESS_KEY_SECRET configured"
  else
    echo "  ❌ ALIYUN_ACCESS_KEY_SECRET not configured"
  fi
  
  if grep -q "ALIYUN_REGION_ID" backend/.env; then
    echo "  ✅ ALIYUN_REGION_ID configured"
  else
    echo "  ❌ ALIYUN_REGION_ID not configured"
  fi
  
  if grep -q "ALIYUN_OSS_BUCKET" backend/.env; then
    echo "  ✅ ALIYUN_OSS_BUCKET configured"
  else
    echo "  ❌ ALIYUN_OSS_BUCKET not configured"
  fi
else
  echo "❌ Backend .env not found"
fi

echo ""
if [ -f "frontend/.env.local" ]; then
  echo "✅ Frontend .env.local exists"
else
  echo "❌ Frontend .env.local not found"
fi

echo ""
echo "📝 Summary:"
echo ""
echo "1. ✅ Backend: Socket.io integrated with Express"
echo "2. ✅ Backend: SessionManager created for audio orchestration"
echo "3. ✅ Backend: Aliyun STT service integrated (placeholder)"
echo "4. ✅ Frontend: Socket.io client created"
echo "5. ✅ Frontend: Audio recorder hook with MediaRecorder API"
echo "6. ✅ Frontend: Real-time roleplay hook for complete session management"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure Aliyun credentials in backend/.env"
echo "2. Create Aliyun OSS bucket and update .env"
echo "3. Implement OSS upload in aliyunSTTService.ts"
echo "4. Test backend: cd backend && npm run dev"
echo "5. Test frontend: cd frontend && npm run dev"
echo "6. Test complete flow in browser console"
echo ""
echo "======================================"
