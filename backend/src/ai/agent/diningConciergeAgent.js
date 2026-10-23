import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { executeMcpTool, MCP_TOOLS_SPEC } from '../mcp/restaurantMcpTools.js';

/**
 * State Definition for LangGraph Dining Concierge
 */
const AgentStateAnnotation = Annotation.Root({
  userMessage: Annotation({
    reducer: (curr, update) => update ?? curr ?? '',
    default: () => '',
  }),
  chatHistory: Annotation({
    reducer: (curr, update) => (update ? [...(curr || []), ...update] : curr || []),
    default: () => [],
  }),
  intent: Annotation({
    reducer: (curr, update) => update ?? curr ?? 'general',
    default: () => 'general',
  }),
  extractedEntities: Annotation({
    reducer: (curr, update) => ({ ...(curr || {}), ...(update || {}) }),
    default: () => ({}),
  }),
  toolResults: Annotation({
    reducer: (curr, update) => (update ? [...(curr || []), ...(Array.isArray(update) ? update : [update])] : curr || []),
    default: () => [],
  }),
  finalResponse: Annotation({
    reducer: (curr, update) => update ?? curr ?? '',
    default: () => '',
  }),
  suggestedActions: Annotation({
    reducer: (curr, update) => update ?? curr ?? [],
    default: () => [],
  }),
});

/**
 * Node 1: Intent & Entity Classifier
 */
async function classifyIntentNode(state) {
  const query = state.userMessage.toLowerCase();
  let intent = 'general';
  const entities = {};

  // Check for table booking / reservation queries
  const tableKeywords = ['table', 'book', 'seat', 'reserve', 'reservation', 'slot', 'available', 'people', 'guests', 'pax', 'pm', 'am', 'tonight', 'tomorrow'];
  const hasTableKeywords = tableKeywords.some((w) => query.includes(w));

  // Check for menu / food / dietary queries
  const foodKeywords = ['menu', 'food', 'dish', 'eat', 'vegan', 'veg', 'non-veg', 'gluten', 'spicy', 'dessert', 'beverage', 'drink', 'calorie', 'protein', 'allergy', 'allergies', 'recommend'];
  const hasFoodKeywords = foodKeywords.some((w) => query.includes(w));

  // Check for deposit / price / billing
  const priceKeywords = ['deposit', 'advance', 'cost', 'bill', 'price', 'pay', 'checkout', '60%'];
  const hasPriceKeywords = priceKeywords.some((w) => query.includes(w));

  if (hasTableKeywords && !hasFoodKeywords) {
    intent = 'table_booking';
  } else if (hasFoodKeywords && !hasTableKeywords) {
    intent = 'menu_recommendation';
  } else if (hasTableKeywords && hasFoodKeywords) {
    intent = 'hybrid_dining';
  } else if (hasPriceKeywords) {
    intent = 'pricing_inquiry';
  }

  // Extract entities
  const guestsMatch = query.match(/(\d+)\s*(people|guests|pax|persons|person)/);
  if (guestsMatch) {
    entities.guestsCount = parseInt(guestsMatch[1], 10);
  } else if (query.includes('couple') || query.includes('for two') || query.includes('for 2')) {
    entities.guestsCount = 2;
  } else if (query.includes('solo') || query.includes('for one') || query.includes('for 1')) {
    entities.guestsCount = 1;
  }

  // Extract dietary
  if (query.includes('vegan') || query.includes('pure veg') || query.includes('vegetarian')) {
    entities.isVeg = true;
  }
  if (query.includes('gluten-free') || query.includes('no gluten')) {
    entities.excludeAllergens = [...(entities.excludeAllergens || []), 'Gluten'];
  }
  if (query.includes('nut allergy') || query.includes('no peanuts') || query.includes('no nuts')) {
    entities.excludeAllergens = [...(entities.excludeAllergens || []), 'Peanuts', 'Nuts'];
  }
  if (query.includes('dairy free') || query.includes('no dairy') || query.includes('lactose')) {
    entities.excludeAllergens = [...(entities.excludeAllergens || []), 'Dairy'];
  }

  // Time slot detection (e.g. 7:00, 8:30 pm, 19:00)
  const timeMatch = query.match(/(\d{1,2})(:(\d{2}))?\s*(pm|am)?/i);
  if (timeMatch && (query.includes('pm') || query.includes('am') || query.includes(':'))) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[3] || '00';
    const isPm = (timeMatch[4] || '').toLowerCase() === 'pm';
    if (isPm && hour < 12) hour += 12;
    entities.timeSlot = `${String(hour).padStart(2, '0')}:${minute}`;
  }

  return { intent, extractedEntities: entities };
}

/**
 * Node 2: Tool Execution via MCP Layer
 */
async function executeToolsNode(state) {
  const { intent, userMessage, extractedEntities } = state;
  const results = [];

  if (intent === 'menu_recommendation' || intent === 'hybrid_dining' || intent === 'general') {
    const menuResult = await executeMcpTool('search_menu_rag', {
      query: userMessage,
      isVeg: extractedEntities.isVeg,
      excludeAllergens: extractedEntities.excludeAllergens,
      maxCalories: extractedEntities.maxCalories,
      maxPrice: extractedEntities.maxPrice,
    });
    results.push(menuResult);
  }

  if (intent === 'table_booking' || intent === 'hybrid_dining') {
    const tableResult = await executeMcpTool('check_table_slots', {
      guestsCount: extractedEntities.guestsCount || 2,
      timeSlot: extractedEntities.timeSlot || '19:00',
    });
    results.push(tableResult);
  }

  return { toolResults: results };
}

/**
 * Node 3: Synthesizer & Response Generator
 */
async function synthesizeResponseNode(state) {
  const { userMessage, intent, extractedEntities, toolResults } = state;
  const apiKey = process.env.GEMINI_API_KEY;
  const hasApiKey = apiKey && apiKey !== 'your_gemini_api_key_here';

  let finalResponse = '';
  const suggestedActions = [];

  // Find relevant tool payloads
  const menuTool = toolResults.find((r) => r.tool === 'search_menu_rag');
  const tableTool = toolResults.find((r) => r.tool === 'check_table_slots');

  if (menuTool && menuTool.dishes && menuTool.dishes.length > 0) {
    menuTool.dishes.slice(0, 3).forEach((d) => {
      suggestedActions.push({
        label: `Pre-order ${d.name} ($${d.price})`,
        type: 'preorder',
        payload: { dishId: d.id, dishName: d.name, price: d.price },
      });
    });
  }

  if (tableTool && tableTool.isSlotAvailable) {
    suggestedActions.push({
      label: `Reserve Table for ${tableTool.guestsCount} at ${tableTool.requestedSlot}`,
      type: 'book_table',
      payload: { guestsCount: tableTool.guestsCount, timeSlot: tableTool.requestedSlot, tableNumber: tableTool.suggestedTableNumber },
    });
  }

  // Generate via Gemini if available
  if (hasApiKey) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const ragSummary = menuTool ? menuTool.ragSummary : 'No specific menu items retrieved.';
      const tableSummary = tableTool
        ? `Table Slot ${tableTool.requestedSlot}: ${tableTool.isSlotAvailable ? 'Available (Suggested Table #' + tableTool.suggestedTableNumber + ')' : 'Fully booked'}. Available slots: ${tableTool.availableSlots?.filter((s) => s.status === 'Available').map((s) => s.slot).join(', ')}`
        : 'No table queries executed.';

      const prompt = `You are Aura, an elite AI Dining Concierge for Chatori Gali.
Customer Query: "${userMessage}"
Detected Intent: ${intent}
Extracted Preferences: ${JSON.stringify(extractedEntities)}

Tool Data (Live Restaurant & Menu Database):
[MENU SELECTIONS]:
${ragSummary}

[TABLE AVAILABILITY]:
${tableSummary}

Instructions:
1. Provide a warm, hospitable, and concise response in markdown.
2. Directly answer their question citing dish names, prices in ₹, calories, or table slots if relevant.
3. Explain the 60% advance pre-order deposit benefit (zero wait time upon arrival!).
4. Add clear formatting with bullet points and bolding for dishes or key details.`;

      const aiResult = await model.generateContent(prompt);
      finalResponse = aiResult.response.text();
    } catch (err) {
      console.warn('[AI Agent] Generation fallback used:', err.message);
    }
  }

  // Robust template fallback if Gemini offline / quota limited
  if (!finalResponse) {
    if (intent === 'menu_recommendation' || (menuTool && menuTool.dishes?.length > 0)) {
      const dishes = menuTool?.dishes || [];
      finalResponse = `Here are our top chef-curated culinary selections tailored to your preferences:\n\n` +
        dishes.map((d, i) => `**${i + 1}. ${d.name}** — *₹${d.price}*\n` +
          `* ${d.description}\n` +
          `* **Diet:** ${d.dietaryInfo?.isVeg ? '🌱 Vegetarian' : '🥩 Non-Veg'} | **Calories:** ${d.dietaryInfo?.calories || 0} kcal | **Protein:** ${d.dietaryInfo?.protein || 0}g\n` +
          (d.dietaryInfo?.allergens?.length ? `* ⚠️ *Allergens: ${d.dietaryInfo.allergens.join(', ')}*\n` : '')).join('\n') +
        `\n\n💡 *Tip: Pre-ordering these dishes with your reservation locks in a **60% advance deposit** and ensures your meals begin cooking 20 minutes before you arrive!*`;
    } else if (intent === 'table_booking' && tableTool) {
      finalResponse = tableTool.isSlotAvailable
        ? `Great news! We have tables available for **${tableTool.guestsCount} guests** at **${tableTool.requestedSlot}** on **${tableTool.date}** (Suggested Table #${tableTool.suggestedTableNumber}).\n\n` +
          `Would you like to reserve this table now? You can also pre-order your favorite dishes in advance to skip dining rush wait times.`
        : `Table slots for ${tableTool.guestsCount} guests at ${tableTool.requestedSlot} are currently busy. Other available time slots today:\n` +
          tableTool.availableSlots.filter((s) => s.status === 'Available').map((s) => `* **${s.slot}** (Open)`).join('\n');
    } else {
      finalResponse = `Welcome to **Chatori Gali**! I'm your Personal Dining Concierge. I can assist you with:\n\n` +
        `* 🔍 **Smart Dietary Search:** Find pure vegetarian, high-protein, or allergen-safe dishes.\n` +
        `* 📅 **Table Reservations:** Check live busy hours and instant seating availability.\n` +
        `* 🍽️ **Meal Pre-ordering:** Select your feast in advance with a 60% advance deposit for arrival-synchronized dining.`;
    }
  }

  return { finalResponse, suggestedActions };
}

/**
 * Build & Compile LangGraph State Machine
 */
export function buildDiningConciergeGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode('classify_intent', classifyIntentNode)
    .addNode('execute_tools', executeToolsNode)
    .addNode('synthesize_response', synthesizeResponseNode)
    .addEdge(START, 'classify_intent')
    .addEdge('classify_intent', 'execute_tools')
    .addEdge('execute_tools', 'synthesize_response')
    .addEdge('synthesize_response', END);

  return workflow.compile();
}

/**
 * Execute the agent workflow
 */
export async function runDiningConcierge(userMessage, chatHistory = []) {
  try {
    const app = buildDiningConciergeGraph();
    const result = await app.invoke({
      userMessage,
      chatHistory,
    });
    return {
      success: true,
      response: result.finalResponse,
      intent: result.intent,
      extractedEntities: result.extractedEntities,
      toolResults: result.toolResults,
      suggestedActions: result.suggestedActions,
    };
  } catch (err) {
    console.error('[LangGraph Agent Error]:', err);
    // Graceful fallback execution
    const classified = await classifyIntentNode({ userMessage });
    const tools = await executeToolsNode({ ...classified, userMessage });
    const synth = await synthesizeResponseNode({ ...classified, ...tools, userMessage });
    return {
      success: true,
      response: synth.finalResponse,
      intent: classified.intent,
      extractedEntities: classified.extractedEntities,
      toolResults: tools.toolResults,
      suggestedActions: synth.suggestedActions,
    };
  }
}
