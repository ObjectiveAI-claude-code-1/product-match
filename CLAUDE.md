# product-match

A vector function that ranks products by how well they match a customer's stated need.

## Design

**Type:** Vector Function

**Input Schema:**
- `need` (string, required): The customer's requirement or search intent
- `products` (array, required, minItems: 1): Products to rank, each with:
  - `name` (string): Product name/title
  - `description` (string): Product description (can include price, specs, features)

**Output:** Array of scores (one per product) that sum to ~1, representing relative match quality.

## Implementation

### Task Structure
- Single `vector.completion` task with system + user messages
- System message provides evaluation guidance (feature alignment, price constraints, category relevance)
- User message presents customer need and formatted product list
- LLM ensemble votes on which product best matches

### Ensemble Configuration
5 LLMs with equal weights (1.0 each):
- `openai/gpt-4.1-nano` - JSON schema output
- `google/gemini-2.5-flash-lite` - JSON schema output
- `x-ai/grok-4.1-fast` - JSON schema, reasoning disabled
- `openai/gpt-4o-mini` - JSON schema, top_logprobs: 20
- `deepseek/deepseek-v3.2` - Instruction output, top_logprobs: 20

### JMESPath Expressions
- **User content**: Constructs prompt from `input.need` and formatted product list
- **Responses**: Extracts product names as voting options
- **Output**: Returns `tasks[0].scores` (normalized scores from LLM votes)
- **Output length**: `length(input.products)`
- **Input split/merge**: Supports SwissSystem strategy for efficient ranking

## Example Categories

The function includes 10 diverse example inputs covering:
1. Lightweight laptops (travel focus)
2. Gaming laptops (performance focus)
3. Budget smartphones (price constraint)
4. Wireless headphones (2 products, close match)
5. Espresso machines (evenly matched)
6. Fitness watches (specific features: GPS, HR)
7. Ergonomic chairs (lumbar support focus)
8. Professional cameras (wildlife photography)
9. Vacuum cleaners (pet owners, allergies)
10. Electric vehicles (family, range, safety)

## Execution Strategies

Supports both:
- **Default Strategy**: Standard all-at-once voting
- **SwissSystem Strategy**: Tournament-style pairwise comparisons (pool: 10, rounds: 3)
