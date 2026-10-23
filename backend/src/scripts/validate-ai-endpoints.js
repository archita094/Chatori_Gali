import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { executeMcpTool, MCP_TOOLS_SPEC } from '../ai/mcp/restaurantMcpTools.js';
import menuVectorStore from '../ai/rag/menuVectorStore.js';
import { runDiningConcierge } from '../ai/agent/diningConciergeAgent.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hotel-reservation';

async function validateAiPipeline() {
  console.log('🧪 Starting AI Pipeline Validation Suite...');

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    // 1. Validate MCP Specs
    console.log('\n--- Test 1: MCP Tool Specifications ---');
    console.log(`Found ${MCP_TOOLS_SPEC.length} MCP tools:`, MCP_TOOLS_SPEC.map((t) => t.name).join(', '));
    if (MCP_TOOLS_SPEC.length < 3) throw new Error('MCP specs incomplete');
    console.log('✅ MCP specifications verified.');

    // 2. Validate Vector Store & RAG
    console.log('\n--- Test 2: Menu Vector Store & RAG Indexing ---');
    const count = await menuVectorStore.indexMenuItems(true);
    console.log(`Indexed items count: ${count}`);

    const searchRes = await menuVectorStore.searchMenu('spicy vegan appetizer', { topK: 3 });
    console.log(`Semantic Search for "spicy vegan appetizer" returned ${searchRes.length} items:`);
    searchRes.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.item.name} ($${r.item.price}) - Score: ${(r.score * 100).toFixed(1)}%`);
    });
    console.log('✅ Vector Store RAG search verified.');

    // 3. Validate MCP Tool Execution
    console.log('\n--- Test 3: Direct MCP Tool Invocation ---');
    const mcpRes = await executeMcpTool('check_table_slots', { guestsCount: 4, timeSlot: '19:00' });
    console.log(`MCP check_table_slots success: ${mcpRes.success}, available table count: ${mcpRes.availableTableCount}`);
    if (!mcpRes.success) throw new Error('MCP execution failed');
    console.log('✅ MCP Tool execution verified.');

    // 4. Validate LangGraph Agentic Concierge
    console.log('\n--- Test 4: LangGraph Dining Concierge Execution ---');
    const agentRes = await runDiningConcierge('Can you suggest a healthy high-protein dinner and check if a table for 2 is available at 8 PM?');
    console.log(`Agent Intent: ${agentRes.intent}`);
    console.log(`Tools Executed: ${agentRes.toolResults.map((t) => t.tool).join(', ')}`);
    console.log(`Suggested Actions: ${agentRes.suggestedActions.length}`);
    console.log('\nAgent Response Preview:\n' + agentRes.response.slice(0, 300) + '...\n');
    console.log('✅ LangGraph Agent execution verified successfully!');

    console.log('\n🎉 ALL AI PIPELINE VALIDATION TESTS PASSED!');
  } catch (err) {
    console.error('❌ Validation failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

validateAiPipeline();
