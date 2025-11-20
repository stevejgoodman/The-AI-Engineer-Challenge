'use client';

import { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { logger } from '../utils/logger';

interface Message {
  role: 'user' | 'assistant' | 'developer';
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [developerMessage, setDeveloperMessage] = useState('Respond as a Geordie');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4.1-mini');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  useEffect(() => {
    logger.info('ChatInterface component mounted');
    return () => {
      logger.info('ChatInterface component unmounted');
    };
  }, []);

  /**
   * Parses error response from the backend to extract meaningful error messages
   */
  const parseErrorResponse = async (response: Response): Promise<string> => {
    try {
      const errorData = await response.json();
      const errorMessage = errorData.detail || errorData.message || 'An unknown error occurred';
      logger.error('Backend error response', { status: response.status, error: errorMessage });
      return errorMessage;
    } catch (parseError) {
      logger.warn('Failed to parse error response', parseError);
      return `HTTP error! status: ${response.status}`;
    }
  };

  /**
   * Determines if an error is related to an invalid API key
   */
  const isInvalidApiKeyError = (errorMessage: string): boolean => {
    const invalidKeyIndicators = [
      'incorrect api key',
      'invalid api key',
      'invalid_api_key',
      'authentication failed',
      'unauthorized',
      'api key not found',
      'invalid authentication',
      'api key provided is invalid',
    ];
    
    const lowerMessage = errorMessage.toLowerCase();
    return invalidKeyIndicators.some(indicator => lowerMessage.includes(indicator));
  };

  /**
   * Determines if an error is related to OpenAI API access
   */
  const isOpenAIError = (errorMessage: string): boolean => {
    const openAIErrorIndicators = [
      'openai',
      'rate limit',
      'quota',
      'insufficient_quota',
      'model',
      'completion',
      'timeout',
      'connection',
      'network',
    ];
    
    const lowerMessage = errorMessage.toLowerCase();
    return openAIErrorIndicators.some(indicator => lowerMessage.includes(indicator));
  };

  /**
   * Formats error message for user display
   */
  const formatErrorMessage = (errorMessage: string): string => {
    if (isInvalidApiKeyError(errorMessage)) {
      return 'Invalid OpenAI API Key. Please check that your API key is correct and has not expired.';
    }
    
    if (isOpenAIError(errorMessage)) {
      return `Error accessing OpenAI: ${errorMessage}. Please check your API key, account status, and try again.`;
    }
    
    return errorMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logger.info('Form submission started', { 
      hasApiKey: !!apiKey.trim(), 
      hasUserMessage: !!userMessage.trim(),
      model 
    });
    
    // Validate API key presence
    if (!apiKey.trim()) {
      const errorMsg = 'Please enter your OpenAI API key';
      logger.warn('Validation failed: missing API key');
      setError(errorMsg);
      return;
    }
    
    // Basic API key format validation
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      const errorMsg = 'Please enter a valid OpenAI API key (should start with "sk-" and be at least 20 characters long)';
      logger.warn('Validation failed: invalid API key format', { apiKeyLength: apiKey.length });
      setError(errorMsg);
      return;
    }
    
    // Validate user message
    if (!userMessage.trim()) {
      const errorMsg = 'Please enter a message';
      logger.warn('Validation failed: missing user message');
      setError(errorMsg);
      return;
    }

    setIsLoading(true);
    setError('');
    setCurrentResponse('');

    // Add user message to chat
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    const messageToSend = userMessage;
    setUserMessage('');

    logger.debug('Sending chat request', { 
      model, 
      developerMessageLength: developerMessage.length,
      userMessageLength: messageToSend.length 
    });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      logger.info('Making API request', { url: `${apiUrl}/api/chat`, model });
      
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: messageToSend,
          model: model,
          api_key: apiKey,
        }),
      });

      logger.debug('API response received', { 
        status: response.status, 
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        const formattedError = formatErrorMessage(errorMessage);
        logger.error('API request failed', { 
          status: response.status, 
          error: errorMessage,
          formattedError 
        });
        setError(formattedError);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const errorMsg = 'No response body received from server';
        logger.error(errorMsg);
        setError(errorMsg);
        return;
      }

      logger.info('Starting to stream response');
      let assistantMessage = '';
      const decoder = new TextDecoder();
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          logger.debug('Streaming completed', { totalChunks: chunkCount, messageLength: assistantMessage.length });
          break;
        }

        const chunk = decoder.decode(value);
        assistantMessage += chunk;
        chunkCount++;
        setCurrentResponse(assistantMessage);
        
        // Log every 10 chunks to avoid excessive logging
        if (chunkCount % 10 === 0) {
          logger.debug('Streaming progress', { chunks: chunkCount, currentLength: assistantMessage.length });
        }
      }

      // Add assistant message to chat
      const newAssistantMessage: Message = {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newAssistantMessage]);
      setCurrentResponse('');
      
      logger.info('Chat message successfully processed', { 
        messageLength: assistantMessage.length,
        totalMessages: messages.length + 2 
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      logger.error('Unexpected error during chat request', { 
        error: error.message,
        stack: error.stack,
        name: error.name 
      });
      
      // Check if it's a network error
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to the server. Please check your internet connection and ensure the backend is running.');
      } else {
        const formattedError = formatErrorMessage(error.message);
        setError(formattedError);
      }
    } finally {
      setIsLoading(false);
      logger.debug('Form submission completed', { isLoading: false });
    }
  };

  const clearChat = () => {
    logger.info('Clearing chat history');
    setMessages([]);
    setCurrentResponse('');
    setError('');
  };

  return (
    <Container fluid className="min-vh-100 bg-light">
      <Row className="justify-content-center py-4">
        <Col xs={12} lg={10} xl={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h2 className="mb-0">
                <i className="bi bi-chat-dots me-2"></i>
                OpenAI Chat Interface
              </h2>
            </Card.Header>
            
            <Card.Body className="p-0">
              {/* Settings Panel */}
              <div className="bg-light border-bottom p-3">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">OpenAI API Key</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Enter your OpenAI API key"
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          logger.debug('API key input changed', { length: e.target.value.length });
                        }}
                        className="border-primary"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Model</Form.Label>
                      <Form.Select
                        value={model}
                        onChange={(e) => {
                          setModel(e.target.value);
                          logger.info('Model changed', { newModel: e.target.value });
                        }}
                        className="border-primary"
                      >
                        <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Developer Message (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Enter system/developer instructions..."
                        value={developerMessage}
                        onChange={(e) => setDeveloperMessage(e.target.value)}
                        className="border-primary"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Chat Messages */}
              <div className="chat-messages p-3" style={{ height: '400px', overflowY: 'auto' }}>
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-chat-square-text fs-1 mb-3 d-block"></i>
                    <p>Start a conversation by entering a message below</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-3 d-flex ${message.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div
                        className={`p-3 rounded-3 max-width-75 ${
                          message.role === 'user'
                            ? 'bg-primary text-white'
                            : message.role === 'developer'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary text-white'
                        }`}
                        style={{ maxWidth: '75%' }}
                      >
                        <div className="fw-bold mb-1 text-capitalize">
                          {message.role === 'developer' ? 'Developer' : message.role}
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <small className="opacity-75">
                          {message.timestamp.toLocaleTimeString()}
                        </small>
                      </div>
                    </div>
                  ))
                )}

                {/* Current streaming response */}
                {currentResponse && (
                  <div className="mb-3 d-flex justify-content-start">
                    <div className="p-3 rounded-3 bg-secondary text-white" style={{ maxWidth: '75%' }}>
                      <div className="fw-bold mb-1">Assistant</div>
                      <div className="whitespace-pre-wrap">{currentResponse}</div>
                      <div className="d-flex align-items-center mt-2">
                        <Spinner size="sm" className="me-2" />
                        <small className="opacity-75">Typing...</small>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="danger" className="m-3">
                  <Alert.Heading>Error</Alert.Heading>
                  {error}
                </Alert>
              )}

              {/* Message Input */}
              <div className="border-top p-3">
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col>
                      <Form.Group className="mb-3">
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Enter your message here..."
                        value={userMessage}
                        onChange={(e) => {
                          setUserMessage(e.target.value);
                          logger.debug('User message input changed', { length: e.target.value.length });
                        }}
                        disabled={isLoading}
                        className="border-primary"
                      />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <div className="d-flex gap-2">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={isLoading || !userMessage.trim() || !apiKey.trim()}
                          className="px-4"
                        >
                          {isLoading ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-send me-2"></i>
                              Send Message
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline-secondary"
                          onClick={clearChat}
                          disabled={isLoading}
                        >
                          <i className="bi bi-trash me-2"></i>
                          Clear Chat
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
