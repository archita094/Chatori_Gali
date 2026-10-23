import menuVectorStore from '../rag/menuVectorStore.js';
import Table from '../../models/Table.js';
import Reservation from '../../models/Reservation.js';
import Restaurant from '../../models/Restaurant.js';
import MenuItem from '../../models/MenuItem.js';

/**
 * Model Context Protocol (MCP) Tool Specifications
 * Conforming to MCP JSON Schema specification for LLM Agents
 */
export const MCP_TOOLS_SPEC = [
  {
    name: 'search_menu_rag',
    description: 'Semantic vector search over restaurant menu items, dietary criteria, ingredients, and allergen safety.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query e.g. "vegan spicy dinner", "gluten-free pasta", "high protein dessert"',
        },
        isVeg: {
          type: 'boolean',
          description: 'Filter strictly vegetarian dishes if true',
        },
        maxCalories: {
          type: 'number',
          description: 'Maximum calorie ceiling in kcal',
        },
        minProtein: {
          type: 'number',
          description: 'Minimum protein target in grams',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price in USD',
        },
        maxSpiceLevel: {
          type: 'number',
          description: 'Spice level between 0 (mild) to 3 (hot)',
        },
        excludeAllergens: {
          type: 'array',
          items: { type: 'string' },
          description: 'Allergens to strictly exclude e.g. ["peanuts", "gluten", "dairy"]',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'check_table_slots',
    description: 'Check table seating availability, remaining capacity, and peak busy hours for a given date and party size.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Target date in YYYY-MM-DD format (defaults to today)',
        },
        timeSlot: {
          type: 'string',
          description: 'Preferred time slot in HH:MM format e.g. "19:00", "20:30"',
        },
        guestsCount: {
          type: 'number',
          description: 'Number of guests in the dining party',
        },
      },
      required: ['guestsCount'],
    },
  },
  {
    name: 'calculate_deposit',
    description: 'Calculate order total, required 60% advance reservation deposit, and estimated prep time.',
    inputSchema: {
      type: 'object',
      properties: {
        itemIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of MenuItem Object IDs selected for pre-order',
        },
        quantities: {
          type: 'array',
          items: { type: 'number' },
          description: 'Corresponding quantity for each item (defaults to 1)',
        },
      },
      required: ['itemIds'],
    },
  },
  {
    name: 'get_restaurant_info',
    description: 'Retrieve restaurant details, operating hours, addresses, and dining policies.',
    inputSchema: {
      type: 'object',
      properties: {
        restaurantId: {
          type: 'string',
          description: 'Optional restaurant ID. If omitted, returns all bistros.',
        },
      },
    },
  },
];

/**
 * Executes an MCP Tool invocation
 */
export async function executeMcpTool(toolName, args = {}) {
  try {
    switch (toolName) {
      case 'search_menu_rag': {
        const results = await menuVectorStore.searchMenu(args.query, {
          isVeg: args.isVeg !== undefined ? args.isVeg : null,
          maxCalories: args.maxCalories,
          minProtein: args.minProtein,
          maxPrice: args.maxPrice,
          maxSpiceLevel: args.maxSpiceLevel,
          excludeAllergens: args.excludeAllergens,
          topK: 4,
        });

        const formatted = results.map((r) => ({
          id: r.item._id,
          name: r.item.name,
          category: r.item.category,
          price: r.item.price,
          description: r.item.description,
          dietaryInfo: r.item.dietaryInfo,
          restaurant: {
            id: r.item.restaurant?._id,
            name: r.item.restaurant?.name,
          },
          relevance: `${Math.round(r.score * 100)}%`,
        }));

        return {
          tool: 'search_menu_rag',
          success: true,
          matchCount: formatted.length,
          dishes: formatted,
          ragSummary: menuVectorStore.formatRagContext(results),
        };
      }

      case 'check_table_slots': {
        const date = args.date || new Date().toISOString().split('T')[0];
        const guests = Number(args.guestsCount) || 2;
        const timeSlot = args.timeSlot || '19:00';

        // Find eligible tables
        const allTables = await Table.find({ capacity: { $gte: guests }, isActive: true });
        
        // Find existing bookings
        const existingBookings = await Reservation.find({
          date,
          status: { $in: ['pending', 'confirmed'] },
        });

        const bookedTablesForSlot = new Set(
          existingBookings
            .filter((b) => b.timeSlot === timeSlot)
            .map((b) => b.tableNumber)
        );

        const availableTables = allTables.filter((t) => !bookedTablesForSlot.has(t.tableNumber));
        
        // Busy hours distribution
        const hourlyOccupancy = {};
        const hours = ['12:00', '13:00', '14:00', '18:00', '19:00', '20:00', '21:00'];
        hours.forEach((h) => {
          hourlyOccupancy[h] = existingBookings.filter((b) => b.timeSlot === h).length;
        });

        return {
          tool: 'check_table_slots',
          success: true,
          date,
          requestedSlot: timeSlot,
          guestsCount: guests,
          isSlotAvailable: availableTables.length > 0,
          availableTableCount: availableTables.length,
          suggestedTableNumber: availableTables.length > 0 ? availableTables[0].tableNumber : null,
          availableSlots: hours.map((h) => ({
            slot: h,
            bookedCount: hourlyOccupancy[h] || 0,
            status: (hourlyOccupancy[h] || 0) >= allTables.length ? 'Fully Booked' : (hourlyOccupancy[h] || 0) > 2 ? 'Busy' : 'Available',
          })),
        };
      }

      case 'calculate_deposit': {
        const itemIds = args.itemIds || [];
        const quantities = args.quantities || itemIds.map(() => 1);

        const items = await MenuItem.find({ _id: { $in: itemIds } });
        let totalFoodAmount = 0;
        const lineItems = [];

        items.forEach((item, idx) => {
          const qty = quantities[idx] || 1;
          const subtotal = item.price * qty;
          totalFoodAmount += subtotal;
          lineItems.push({
            id: item._id,
            name: item.name,
            unitPrice: item.price,
            quantity: qty,
            subtotal,
          });
        });

        const advanceAmount = Math.round(totalFoodAmount * 0.6 * 100) / 100; // 60%
        const balanceDueAtTable = Math.round((totalFoodAmount - advanceAmount) * 100) / 100;

        return {
          tool: 'calculate_deposit',
          success: true,
          lineItems,
          totalFoodAmount,
          advancePercentage: '60%',
          advanceAmount,
          balanceDueAtTable,
        };
      }

      case 'get_restaurant_info': {
        const query = args.restaurantId ? { _id: args.restaurantId } : {};
        const restaurants = await Restaurant.find(query);
        return {
          tool: 'get_restaurant_info',
          success: true,
          restaurants: restaurants.map((r) => ({
            id: r._id,
            name: r.name,
            cuisine: r.cuisine,
            address: r.address,
            phone: r.phone,
            rating: r.rating,
          })),
        };
      }

      default:
        return {
          tool: toolName,
          success: false,
          error: `Unknown tool name: ${toolName}`,
        };
    }
  } catch (err) {
    return {
      tool: toolName,
      success: false,
      error: err.message,
    };
  }
}
