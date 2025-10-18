'use client';

import { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';

interface Message {
  role: 'user' | 'assistant' | 'developer';
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [developerMessage, setDeveloperMessage] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }
    
    if (!userMessage.trim()) {
      setError('Please enter a message');
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
    setUserMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          model: model,
          api_key: apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;
        setCurrentResponse(assistantMessage);
      }

      // Add assistant message to chat
      const newAssistantMessage: Message = {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newAssistantMessage]);
      setCurrentResponse('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
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
                        onChange={(e) => setApiKey(e.target.value)}
                        className="border-primary"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Model</Form.Label>
                      <Form.Select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
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
                          onChange={(e) => setUserMessage(e.target.value)}
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
