import { runDiningConcierge } from '../ai/agent/diningConciergeAgent.js';
import menuVectorStore from '../ai/rag/menuVectorStore.js';
import { MCP_TOOLS_SPEC, executeMcpTool } from '../ai/mcp/restaurantMcpTools.js';

/**
 * Handle real-time Server-Sent Events (SSE) streaming chat
 * Matches JD: "Handle streaming responses (SSE / WebSockets) for real-time AI interactions"
 */
export const streamChat = async (req, res) => {
  const { message, chatHistory = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A valid message string is required.' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('status', {
      step: 'analyzing',
      message: '🔍 Consulting Chatori Gali concierge...',
    });

    // Run the agent workflow
    const agentResult = await runDiningConcierge(message, chatHistory);

    // Notify of tool executions
    if (agentResult.toolResults && agentResult.toolResults.length > 0) {
      for (const t of agentResult.toolResults) {
        const userMsg = t.tool === 'search_menu_rag'
          ? `🍲 Found ${t.dishes?.length || 0} matching dishes on our menu`
          : t.tool === 'check_table_slots'
          ? `📅 Checked table availability (${t.availableTableCount || 0} tables open)`
          : '✨ Preparing dining details...';

        sendEvent('status', {
          step: 'tool_execution',
          tool: t.tool,
          message: userMsg,
        });
      }
    }

    const synthMessage =
      agentResult.intent === 'pricing_inquiry'
        ? '✨ Calculating 60% pre-order deposit benefits...'
        : agentResult.intent === 'table_booking'
        ? '📅 Preparing table reservation options...'
        : '✨ Preparing your dining recommendations...';

    sendEvent('status', {
      step: 'synthesizing',
      message: synthMessage,
    });

    // Stream tokens in small chunks to simulate/deliver real-time streaming
    const fullText = agentResult.response;
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ') + ' ';
      sendEvent('token', { chunk });
      // Minor delay to enable smooth visual typewriter streaming in frontend
      await new Promise((resolve) => setTimeout(resolve, 35));
    }

    // Send actions (buttons for pre-orders, booking links)
    if (agentResult.suggestedActions?.length > 0) {
      sendEvent('actions', { actions: agentResult.suggestedActions });
    }

    sendEvent('done', {
      intent: agentResult.intent,
      extractedEntities: agentResult.extractedEntities,
      toolsUsed: agentResult.toolResults.map((t) => t.tool),
    });

    res.write('event: end\ndata: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[SSE Stream Error]:', err);
    sendEvent('error', { message: err.message || 'Stream generation failed.' });
    res.end();
  }
};

/**
 * Standard JSON Chat fallback
 */
export const chat = async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const result = await runDiningConcierge(message, chatHistory);
    res.json(result);
  } catch (err) {
    console.error('[AI Chat Error]:', err);
    res.status(500).json({ error: err.message || 'AI Chat failed.' });
  }
};

/**
 * Semantic Vector Menu Search Endpoint (RAG)
 */
export const semanticMenuSearch = async (req, res) => {
  try {
    const { q, isVeg, maxCalories, minProtein, maxPrice, maxSpiceLevel, allergens, topK } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query parameter q is required.' });
    }

    const excludeAllergens = allergens ? allergens.split(',').map((a) => a.trim()) : [];

    const results = await menuVectorStore.searchMenu(q, {
      isVeg: isVeg !== undefined ? isVeg === 'true' : null,
      maxCalories: maxCalories ? Number(maxCalories) : null,
      minProtein: minProtein ? Number(minProtein) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      maxSpiceLevel: maxSpiceLevel !== undefined ? Number(maxSpiceLevel) : null,
      excludeAllergens,
      topK: topK ? Number(topK) : 6,
    });

    res.json({
      query: q,
      count: results.length,
      results: results.map((r) => ({
        id: r.item._id,
        name: r.item.name,
        category: r.item.category,
        price: r.item.price,
        description: r.item.description,
        dietaryInfo: r.item.dietaryInfo,
        restaurant: r.item.restaurant,
        similarityScore: r.score,
      })),
    });
  } catch (err) {
    console.error('[Semantic Search Error]:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Model Context Protocol (MCP) Tool Specifications
 */
export const getMcpTools = async (req, res) => {
  res.json({
    protocolVersion: '2024-11-05',
    tools: MCP_TOOLS_SPEC,
  });
};

/**
 * Direct MCP Tool Call Endpoint
 */
export const callMcpTool = async (req, res) => {
  try {
    const { name, arguments: toolArgs } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tool name is required.' });
    }

    const result = await executeMcpTool(name, toolArgs);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
