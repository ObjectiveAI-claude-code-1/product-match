# product-match

An [ObjectiveAI](https://objective-ai.io) vector function that ranks products by how well they match a customer's stated need.

## Overview

Given a customer's requirement and a list of products, this function returns normalized scores indicating how well each product matches the need. Uses ensemble LLM voting across 5 models for accurate, balanced rankings.

## Input Schema

```json
{
  "need": "string - The customer's requirement or search intent",
  "products": [
    {
      "name": "string - Product name/title",
      "description": "string - Product description (can include price, specs, features)"
    }
  ]
}
```

## Output

Array of scores (one per product) that sum to ~1, representing relative match quality.

## Example

**Input:**
```json
{
  "need": "A lightweight laptop for frequent travel with long battery life",
  "products": [
    {
      "name": "MacBook Air M3",
      "description": "13.6-inch Retina display, M3 chip, 1.24kg, 18-hour battery life, fanless design"
    },
    {
      "name": "Dell XPS 15",
      "description": "15.6-inch OLED display, Intel Core i7, 1.86kg, 13-hour battery, powerful GPU"
    },
    {
      "name": "Lenovo ThinkPad X1 Carbon",
      "description": "14-inch display, Intel Core Ultra, 1.12kg, 15-hour battery, military-grade durability"
    }
  ]
}
```

**Output:**
```json
[0.35, 0.25, 0.40]
```
*(Scores vary based on LLM ensemble voting)*

## Ensemble Configuration

The function uses 5 LLMs with equal voting weights:

| Model | Output Mode | Features |
|-------|-------------|----------|
| `openai/gpt-4.1-nano` | JSON schema | Fast, structured |
| `google/gemini-2.5-flash-lite` | JSON schema | Fast, structured |
| `x-ai/grok-4.1-fast` | JSON schema | Reasoning disabled |
| `openai/gpt-4o-mini` | JSON schema | Logprobs enabled |
| `deepseek/deepseek-v3.2` | Instruction | Logprobs enabled |

## Execution Strategies

- **Default Strategy**: All products evaluated simultaneously
- **SwissSystem Strategy**: Tournament-style pairwise comparisons for large product lists

## Development

```bash
# Install dependencies
npm install

# Run tests
npm run build

# Run experiment script
npm run start
```

## Files

- `function.json` - Exported function definition
- `profile.json` - Exported ensemble profile
- `defs.ts` - Source definitions (Function, Profile, ExampleInputs)
- `main.ts` - Experiment scratchpad

## License

MIT
