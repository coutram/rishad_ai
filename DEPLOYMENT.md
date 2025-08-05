# Deploying Rishad AI to Vercel

This guide will help you deploy the Rishad AI application to Vercel.

## Prerequisites

1. A Vercel account (free at [vercel.com](https://vercel.com))
2. Your OpenAI API key
3. Git repository with your code

## Step 1: Prepare Your Repository

Make sure your repository contains all the necessary files:
- `package.json` with dependencies
- `vercel.json` configuration
- `api/` directory with API routes
- `public/` directory with frontend files
- `src/` directory with source code

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from your project directory:
```bash
vercel
```

4. Follow the prompts to configure your project.

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Configure the project settings

## Step 3: Configure Environment Variables

1. In your Vercel dashboard, go to your project settings
2. Navigate to the "Environment Variables" section
3. Add the following environment variable:

```
OPENAI_API_KEY=your_openai_api_key_here
```

4. Replace `your_openai_api_key_here` with your actual OpenAI API key
5. Save the environment variable

## Step 4: Deploy

1. If using CLI: Run `vercel --prod` to deploy to production
2. If using dashboard: Click "Deploy" in the Vercel dashboard

## Step 5: Test Your Deployment

Once deployed, your application will be available at:
- Production: `https://your-project-name.vercel.app`
- Preview: `https://your-project-name-git-branch.vercel.app`

Test the following endpoints:
- `GET /api/health` - Health check
- `POST /api/chat` - Chat functionality
- `POST /api/analyze` - Content analysis
- `POST /api/transform` - Content transformation

## API Endpoints

### Chat
```bash
POST /api/chat
Content-Type: application/json

{
  "message": "What are Rishad's thoughts on the future of work?",
  "context": []
}
```

### Analyze Content
```bash
POST /api/analyze
Content-Type: application/json

{
  "content": "Your content to analyze",
  "analysisType": "general"
}
```

### Transform Content
```bash
POST /api/transform
Content-Type: application/json

{
  "content": "Your content to transform",
  "preserveMeaning": true,
  "format": "general"
}
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Working**
   - Make sure you've added the environment variable in Vercel dashboard
   - Redeploy after adding environment variables

2. **API Routes Not Found**
   - Check that your `api/` directory structure is correct
   - Verify `vercel.json` configuration

3. **CORS Issues**
   - The API routes include CORS headers for cross-origin requests

4. **Function Timeout**
   - Vercel functions have a 10-second timeout on Hobby plan
   - Consider upgrading to Pro plan for longer timeouts

### Debugging

1. Check Vercel function logs in the dashboard
2. Use `vercel logs` command to view deployment logs
3. Test API endpoints individually using curl or Postman

## Local Development

To test locally before deploying:

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Start the development server:
```bash
npm run chat
```

4. Open `http://localhost:3001` in your browser

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project settings
2. Navigate to "Domains" section
3. Add your custom domain
4. Configure DNS settings as instructed by Vercel

## Monitoring

- Use Vercel Analytics to monitor performance
- Check function execution times and errors
- Monitor API usage and costs

## Security Notes

- Never commit your OpenAI API key to version control
- Use environment variables for all sensitive data
- Consider implementing rate limiting for production use
- Monitor API usage to avoid unexpected costs

## Support

If you encounter issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review function logs in Vercel dashboard
3. Test API endpoints individually
4. Verify environment variables are set correctly 