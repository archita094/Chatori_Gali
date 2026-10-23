import MenuItem from '../../models/MenuItem.js';

/**
 * MenuVectorStore: Implements in-memory Vector Database & RAG indexing
 * for culinary items, dietary tags, allergens, and flavor profiles.
 */
class MenuVectorStore {
  constructor() {
    this.vectors = []; // { id, item, text, embedding, tokens }
    this.lastIndexedAt = null;
    this.geminiClient = null;
  }

  /**
   * Initialize embedding client using Gemini API if key is present
   */
  async getGeminiClient() {
    if (this.geminiClient) return this.geminiClient;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        this.geminiClient = new GoogleGenerativeAI(apiKey);
      } catch (err) {
        console.warn('[VectorStore] Could not load @google/generative-ai:', err.message);
      }
    }
    return this.geminiClient;
  }

  /**
   * Tokenize text into normalized term frequencies (fallback embedding)
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
  }

  /**
   * Compute TF-IDF style pseudo-embedding vector for offline / fast fallback
   */
  computeLocalEmbedding(tokens, vocabulary) {
    const vec = new Array(vocabulary.length).fill(0);
    const tokenCounts = {};
    for (const t of tokens) {
      tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    }
    for (let i = 0; i < vocabulary.length; i++) {
      const word = vocabulary[i];
      if (tokenCounts[word]) {
        vec[i] = tokenCounts[word] / tokens.length;
      }
    }
    // L2 Normalize
    const mag = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    return mag > 0 ? vec.map((v) => v / mag) : vec;
  }

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Ingest and build vector embeddings for all menu items
   */
  async indexMenuItems(force = false) {
    const now = Date.now();
    // Cache for 10 minutes unless forced
    if (!force && this.lastIndexedAt && now - this.lastIndexedAt < 10 * 60 * 1000) {
      return this.vectors.length;
    }

    try {
      const items = await MenuItem.find({ isAvailable: true }).populate('restaurant', 'name cuisine address rating');
      if (!items || items.length === 0) return 0;

      // Build rich document representation per menu item
      const documents = items.map((item) => {
        const diet = item.dietaryInfo || {};
        const allergens = (diet.allergens || []).join(', ') || 'none';
        const vegStatus = diet.isVeg ? 'Vegetarian Pure Veg' : 'Non-Vegetarian Meat';
        const spiceDesc = diet.spicyLevel === 0 ? 'Mild No Spice' : diet.spicyLevel === 1 ? 'Mild' : diet.spicyLevel === 2 ? 'Medium Spicy' : 'Very Hot Spicy';
        const restName = item.restaurant?.name || 'Aura Bistro';
        const restCuisine = item.restaurant?.cuisine || 'Contemporary';

        const docText = `Dish: ${item.name}. Category: ${item.category}. Description: ${item.description}. ` +
          `Diet: ${vegStatus}. Calories: ${diet.calories || 0} kcal. Protein: ${diet.protein || 0} grams. ` +
          `Spice: ${spiceDesc}. Allergens: ${allergens}. Restaurant: ${restName} (${restCuisine}). Price: $${item.price}.`;

        return {
          id: item._id.toString(),
          item,
          docText,
          tokens: this.tokenize(docText),
        };
      });

      // Build global vocabulary for fallback TF-IDF vectorizer
      const vocabSet = new Set();
      documents.forEach((d) => d.tokens.forEach((t) => vocabSet.add(t)));
      this.vocabulary = Array.from(vocabSet);

      const genAI = await this.getGeminiClient();
      let usedGemini = false;

      // Attempt Gemini embeddings if available
      if (genAI) {
        try {
          const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
          const vectors = [];

          for (const doc of documents) {
            try {
              const res = await embeddingModel.embedContent(doc.docText);
              vectors.push({
                ...doc,
                embedding: res.embedding.values,
                isDense: true,
              });
            } catch (embedErr) {
              // Fallback for single doc
              vectors.push({
                ...doc,
                embedding: this.computeLocalEmbedding(doc.tokens, this.vocabulary),
                isDense: false,
              });
            }
          }

          this.vectors = vectors;
          usedGemini = true;
        } catch (e) {
          console.warn('[VectorStore] Gemini batch embed error, falling back to local vectors:', e.message);
        }
      }

      if (!usedGemini) {
        this.vectors = documents.map((doc) => ({
          ...doc,
          embedding: this.computeLocalEmbedding(doc.tokens, this.vocabulary),
          isDense: false,
        }));
      }

      this.lastIndexedAt = now;
      console.log(`[VectorStore] Indexed ${this.vectors.length} menu items into Vector Store (Gemini Embeddings: ${usedGemini}).`);
      return this.vectors.length;
    } catch (err) {
      console.error('[VectorStore] Error indexing menu items:', err);
      return 0;
    }
  }

  /**
   * Semantic Vector Search with metadata filtering
   */
  async searchMenu(query, options = {}) {
    await this.indexMenuItems();
    if (!this.vectors.length) return [];

    const {
      topK = 5,
      isVeg = null,
      maxCalories = null,
      minProtein = null,
      maxPrice = null,
      maxSpiceLevel = null,
      excludeAllergens = [],
      category = null,
    } = options;

    const queryTokens = this.tokenize(query);
    let queryEmbedding = null;

    const genAI = await this.getGeminiClient();
    if (genAI && this.vectors.some((v) => v.isDense)) {
      try {
        const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const res = await embeddingModel.embedContent(query);
        queryEmbedding = res.embedding.values;
      } catch (err) {
        // Fallback to local vector
        queryEmbedding = this.computeLocalEmbedding(queryTokens, this.vocabulary || []);
      }
    } else {
      queryEmbedding = this.computeLocalEmbedding(queryTokens, this.vocabulary || []);
    }

    const scored = [];

    for (const record of this.vectors) {
      const item = record.item;
      const diet = item.dietaryInfo || {};

      // Filter: Vegetarian
      if (isVeg !== null && diet.isVeg !== isVeg) continue;

      // Filter: Max Calories
      if (maxCalories && diet.calories && diet.calories > maxCalories) continue;

      // Filter: Min Protein
      if (minProtein && diet.protein && diet.protein < minProtein) continue;

      // Filter: Max Price
      if (maxPrice && item.price > maxPrice) continue;

      // Filter: Spice Level
      if (maxSpiceLevel !== null && diet.spicyLevel > maxSpiceLevel) continue;

      // Filter: Category
      if (category && item.category !== category) continue;

      // Filter: Exclude Allergens
      if (excludeAllergens && excludeAllergens.length > 0) {
        const itemAllergens = (diet.allergens || []).map((a) => a.toLowerCase());
        const hasForbidden = excludeAllergens.some((ex) => itemAllergens.includes(ex.toLowerCase()));
        if (hasForbidden) continue;
      }

      // Calculate Similarity
      let score = 0;
      if (record.isDense && queryEmbedding.length === record.embedding.length) {
        score = this.cosineSimilarity(queryEmbedding, record.embedding);
      } else {
        const localQueryVec = this.computeLocalEmbedding(queryTokens, this.vocabulary || []);
        score = this.cosineSimilarity(localQueryVec, record.embedding);
      }

      // Exact keyword boost (keyword presence in title/description)
      const titleLower = item.name.toLowerCase();
      const descLower = item.description.toLowerCase();
      for (const t of queryTokens) {
        if (titleLower.includes(t)) score += 0.15;
        if (descLower.includes(t)) score += 0.05;
      }

      scored.push({
        score: Math.min(1.0, score),
        item,
        docSnippet: record.docText,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Format retrieved items into structured RAG prompt context
   */
  formatRagContext(searchResults) {
    if (!searchResults || searchResults.length === 0) {
      return 'No relevant dishes matched the customer inquiry.';
    }

    return searchResults
      .map((res, idx) => {
        const item = res.item;
        const diet = item.dietaryInfo || {};
        return `[Dish ${idx + 1}] ID: ${item._id}
Name: ${item.name} | Category: ${item.category} | Price: $${item.price}
Description: ${item.description}
Diet: ${diet.isVeg ? 'Vegetarian' : 'Non-Veg'} | Calories: ${diet.calories}kcal | Protein: ${diet.protein}g | Spice: ${diet.spicyLevel}/3
Allergens: ${(diet.allergens || []).join(', ') || 'None'}
Restaurant: ${item.restaurant?.name || 'Aura Bistro'} (Rating: ${item.restaurant?.rating || '4.8'})
Relevance Score: ${(res.score * 100).toFixed(1)}%`;
      })
      .join('\n\n');
  }
}

export const menuVectorStore = new MenuVectorStore();
export default menuVectorStore;
