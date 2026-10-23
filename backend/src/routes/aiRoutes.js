import express from 'express';
import {
  streamChat,
  chat,
  semanticMenuSearch,
  getMcpTools,
  callMcpTool,
} from '../controllers/aiController.js';

const router = express.Router();

// Real-time SSE streaming conversational agent
router.post('/chat/stream', streamChat);

// Non-streaming chat fallback
router.post('/chat', chat);

// Semantic RAG menu search
router.get('/menu/search', semanticMenuSearch);

// Model Context Protocol (MCP) endpoints
router.get('/mcp/tools', getMcpTools);
router.post('/mcp/call', callMcpTool);

export default router;
