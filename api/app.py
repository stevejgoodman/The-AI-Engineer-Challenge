# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
from openai import AuthenticationError, APIError, RateLimitError, APIConnectionError, APITimeoutError
import os
import logging
from typing import Optional

# Set up logging
logger = logging.getLogger(__name__)

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
# Note: When allow_credentials=True, you cannot use allow_origins=["*"]
# Since we don't need credentials (cookies), we set it to False to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin (works with allow_credentials=False)
    allow_credentials=False,  # Set to False to allow wildcard origins
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers in requests
    expose_headers=["*"],  # Exposes all headers in responses
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Create the stream outside the generator to catch errors before response starts
        # This allows us to return proper HTTP error codes
        try:
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "developer", "content": request.developer_message},
                    {"role": "user", "content": request.user_message}
                ],
                stream=True  # Enable streaming response
            )
        except AuthenticationError as e:
            # Invalid API key or authentication failed
            error_detail = {
                "error": "Invalid OpenAI API key",
                "message": "The provided API key is invalid or has expired. Please check your API key and try again.",
                "details": str(e)
            }
            raise HTTPException(status_code=401, detail=error_detail)
        except RateLimitError as e:
            # Rate limit exceeded
            error_detail = {
                "error": "Rate limit exceeded",
                "message": "You have exceeded your OpenAI API rate limit. Please try again later.",
                "details": str(e)
            }
            raise HTTPException(status_code=429, detail=error_detail)
        except APIConnectionError as e:
            # Network/connection error
            error_detail = {
                "error": "Connection error",
                "message": "Unable to connect to OpenAI API. Please check your internet connection and try again.",
                "details": str(e)
            }
            raise HTTPException(status_code=503, detail=error_detail)
        except APITimeoutError as e:
            # Timeout error
            error_detail = {
                "error": "Request timeout",
                "message": "The request to OpenAI API timed out. Please try again.",
                "details": str(e)
            }
            raise HTTPException(status_code=504, detail=error_detail)
        except APIError as e:
            # Other OpenAI API errors
            error_detail = {
                "error": "OpenAI API error",
                "message": f"An error occurred while accessing OpenAI API: {str(e)}",
                "details": str(e)
            }
            raise HTTPException(status_code=502, detail=error_detail)
        
        # Create an async generator function for streaming responses
        async def generate():
            try:
                # Yield each chunk of the response as it becomes available
                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        yield chunk.choices[0].delta.content
            except Exception as e:
                # If an error occurs during streaming, we can't change HTTP status
                # but we can log it for debugging
                # In production, you might want to yield an error message
                logger.error(f"Error during streaming: {str(e)}")
                raise

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except HTTPException:
        # Re-raise HTTP exceptions (from the generator)
        raise
    except AuthenticationError as e:
        # Catch authentication errors that occur before streaming starts
        error_detail = {
            "error": "Invalid OpenAI API key",
            "message": "The provided API key is invalid or has expired. Please check your API key and try again.",
            "details": str(e)
        }
        raise HTTPException(status_code=401, detail=error_detail)
    except RateLimitError as e:
        # Catch rate limit errors that occur before streaming starts
        error_detail = {
            "error": "Rate limit exceeded",
            "message": "You have exceeded your OpenAI API rate limit. Please try again later.",
            "details": str(e)
        }
        raise HTTPException(status_code=429, detail=error_detail)
    except APIConnectionError as e:
        # Catch connection errors that occur before streaming starts
        error_detail = {
            "error": "Connection error",
            "message": "Unable to connect to OpenAI API. Please check your internet connection and try again.",
            "details": str(e)
        }
        raise HTTPException(status_code=503, detail=error_detail)
    except APITimeoutError as e:
        # Catch timeout errors that occur before streaming starts
        error_detail = {
            "error": "Request timeout",
            "message": "The request to OpenAI API timed out. Please try again.",
            "details": str(e)
        }
        raise HTTPException(status_code=504, detail=error_detail)
    except APIError as e:
        # Catch other OpenAI API errors that occur before streaming starts
        error_detail = {
            "error": "OpenAI API error",
            "message": f"An error occurred while accessing OpenAI API: {str(e)}",
            "details": str(e)
        }
        raise HTTPException(status_code=502, detail=error_detail)
    except Exception as e:
        # Handle any other unexpected errors
        error_detail = {
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "details": str(e)
        }
        raise HTTPException(status_code=500, detail=error_detail)

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
