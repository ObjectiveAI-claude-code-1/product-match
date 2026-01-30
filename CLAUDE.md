# product-match

A vector function that ranks products by how well they match a customer's stated need.

## Design

**Type:** Vector Function

**Input Schema:**
- `need` (string, required): The customer's requirement or search intent
- `products` (array, required, minItems: 1): Products to rank, each with:
  - `name` (string): Product name/title
  - `description` (string): Product description

**Output:** Array of scores (one per product) that sum to ~1, representing relative match quality.

## Implementation

- Single vector.completion task asking LLMs to evaluate which product best matches the need
- Uses ensemble of models with equal weights
- Output expression normalizes scores
