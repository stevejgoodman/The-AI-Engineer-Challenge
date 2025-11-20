# 🚀 Deploying FastAPI Backend to Vercel

This guide will walk you through deploying your FastAPI backend to Vercel.

## Prerequisites

- ✅ Vercel CLI installed (`npm install -g vercel` or `brew install vercel`)
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Git repository connected to Vercel

## 📋 Pre-Deployment Checklist

Your backend is ready to deploy! Here's what's already set up:

- ✅ `vercel.json` configuration file
- ✅ `requirements.txt` with dependencies
- ✅ FastAPI application (`app.py`)
- ✅ CORS middleware configured

## 🚀 Deployment Methods

### Method 1: Deploy via Vercel CLI (Recommended)

1. **Navigate to the project root:**
   ```bash
   cd /path/to/The-AI-Engineer-Challenge
   ```

2. **Deploy to production:**
   ```bash
   vercel --prod --yes
   ```

3. **Or deploy to preview:**
   ```bash
   vercel
   ```

### Method 2: Deploy via Vercel Dashboard

1. **Push your code to GitHub:**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect your FastAPI setup

3. **Configure Project Settings:**
   - Root Directory: Leave as root
   - Framework Preset: Other
   - Build Command: Leave empty
   - Output Directory: Leave empty

4. **Deploy!**

## ⚙️ Configuration Files Explained

### `api/vercel.json`

This file tells Vercel how to build and deploy your FastAPI app:

```json
{
  "version": 2,
  "builds": [
    { "src": "app.py", "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "app.py" }
  ]
}
```

- `builds`: Uses Vercel's Python runtime
- `routes`: Routes all requests to `app.py`

### `api/requirements.txt`

Lists all Python dependencies:
```
fastapi==0.120.0
openai==2.6.1
pydantic==2.12.3
python-multipart==0.0.20
uvicorn==0.38.0
```

## 🔧 Testing Your Deployment

Once deployed, test your endpoints:

### Health Check
```bash
curl https://your-backend-url.vercel.app/api/health
```

Expected response:
```json
{"status":"ok"}
```

### Chat Endpoint
```bash
curl -X POST https://your-backend-url.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "developer_message": "You are a helpful assistant.",
    "user_message": "Hello!",
    "model": "gpt-4.1-mini",
    "api_key": "sk-your-openai-key"
  }'
```

## 🌍 Environment Variables (Optional)

If you want to set a default OpenAI API key (not recommended for security):

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add: `OPENAI_API_KEY` = `your-key`
5. Redeploy

## 📝 Common Issues & Solutions

### Issue: "Module not found" errors
**Solution:** Make sure all dependencies are in `requirements.txt`

### Issue: Build timeout
**Solution:** Vercel has a 45-second build limit for serverless functions. Your app should build fine.

### Issue: CORS errors
**Solution:** Already configured in `app.py` with `allow_origins=["*"]`

### Issue: API key authentication errors
**Solution:** Users should provide their own OpenAI API key in the frontend

## 🔗 Connecting Frontend to Backend

After deploying your backend:

1. Note your backend URL (e.g., `https://your-backend.vercel.app`)

2. Update your frontend environment variable:
   - Go to Vercel → Your Frontend Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend.vercel.app`

3. Redeploy your frontend

## 🎉 Success!

Your backend is now live and ready to serve requests from your frontend!

## 📊 Monitoring

- View logs: `vercel logs [deployment-url]`
- View dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)

## 🔄 Updating Your Deployment

To update your deployed backend:

1. Make changes to your code
2. Commit and push to Git
3. Vercel will auto-deploy (if connected to Git)
4. Or run `vercel --prod` again

## 📚 Additional Resources

- [Vercel Python Documentation](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

