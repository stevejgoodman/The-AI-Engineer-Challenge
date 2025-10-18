# OpenAI Chat Interface Frontend

A modern, responsive chat interface built with Next.js and Bootstrap for interacting with the OpenAI API through our FastAPI backend.

## Features

- **Streaming Chat Interface**: Real-time streaming responses from OpenAI API
- **Multiple Model Support**: Choose between GPT-4.1 Mini, GPT-4, and GPT-3.5 Turbo
- **Developer Instructions**: Optional system/developer message field for context
- **Secure API Key Input**: Password-style input for OpenAI API key
- **Responsive Design**: Bootstrap-based UI that works on all devices
- **Real-time Feedback**: Loading states, error handling, and streaming indicators
- **Chat History**: Persistent chat history during session
- **Clean UI**: Modern blue-themed Bootstrap design with good contrast

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager
- Running FastAPI backend (see main project README)

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Mode

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Usage

1. **Start the Backend**: Make sure your FastAPI backend is running on `http://localhost:8000`
2. **Enter API Key**: Enter your OpenAI API key in the password field
3. **Choose Model**: Select your preferred OpenAI model (default: GPT-4.1 Mini)
4. **Add Developer Context** (Optional): Enter system instructions or context for the AI
5. **Start Chatting**: Type your message and click "Send Message"

## API Integration

The frontend communicates with the FastAPI backend at `http://localhost:8000/api/chat` and expects:

- **Request Format**:
  ```json
  {
    "developer_message": "string",
    "user_message": "string", 
    "model": "gpt-4.1-mini",
    "api_key": "your-openai-api-key"
  }
  ```

- **Response**: Streaming text response

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Bootstrap 5**: CSS framework with blue theme
- **Bootstrap Icons**: Icon library
- **React Bootstrap**: Bootstrap components for React
- **Tailwind CSS**: Utility-first CSS framework (for custom styles)

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles and Bootstrap customizations
│   │   ├── layout.tsx       # Root layout with Bootstrap imports
│   │   └── page.tsx         # Main chat interface component
│   └── ...
├── package.json
└── README.md
```

## Deployment

This frontend is designed to be deployed on Vercel. To deploy:

1. Push your code to a Git repository
2. Connect the repository to Vercel
3. Vercel will automatically detect the Next.js project and deploy it

For local testing, ensure the backend URL in the code matches your deployment environment.

## Customization

### Changing Backend URL

To change the backend URL, update the fetch URL in `src/app/page.tsx`:

```typescript
const response = await fetch('YOUR_BACKEND_URL/api/chat', {
  // ... rest of the configuration
});
```

### Styling

The application uses Bootstrap with a blue theme. You can customize colors by modifying the CSS variables in `src/app/globals.css`.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend CORS settings allow requests from your frontend domain
2. **API Key Issues**: Make sure your OpenAI API key is valid and has sufficient credits
3. **Backend Connection**: Verify the backend is running and accessible at the configured URL

### Development Tips

- Use browser developer tools to monitor network requests
- Check the browser console for any JavaScript errors
- Ensure both frontend and backend are running simultaneously

## Contributing

When contributing to this frontend:

1. Follow the existing code style and patterns
2. Ensure all new features include proper error handling
3. Test the UI on different screen sizes
4. Maintain the Bootstrap blue theme consistency
5. Add appropriate loading states and user feedback