import { Functions } from "objectiveai";
import { ExampleInput } from "./example_input";

export const Function: Functions.RemoteFunction = {
  type: "vector.function",
  description:
    "Product Match Ranking. Given a customer need and a list of products, rank products by how well they match the stated need.",
  changelog: "Added system message for improved evaluation guidance and consistency.",
  input_schema: {
    type: "object",
    properties: {
      need: {
        type: "string",
        description: "The customer's requirement, need, or search intent.",
      },
      products: {
        type: "array",
        description: "Products to rank by match quality.",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Product name or title.",
            },
            description: {
              type: "string",
              description: "Product description or details. Can include price, specs, and features.",
            },
          },
          required: ["name", "description"],
        },
      },
    },
    required: ["need", "products"],
  },
  input_maps: null,
  tasks: [
    {
      type: "vector.completion",
      skip: null,
      map: null,
      messages: [
        {
          role: "system",
          content:
            "You are a product matching expert. Evaluate how well each product matches the customer's stated need. Consider: 1) Direct feature alignment, 2) Price constraints if mentioned, 3) Category relevance, 4) Overall suitability. Select the product that BEST matches.",
        },
        {
          role: "user",
          content: {
            $jmespath:
              "join('', ['Customer need: \"', input.need, '\"\n\nProducts:\n\n', join('\n\n', input.products[].join('', ['- ', name, ': ', description]))])",
          },
        },
      ],
      tools: null,
      responses: {
        $jmespath: "input.products[].name",
      },
    },
  ],
  output: {
    $jmespath: "tasks[0].scores",
  },
  output_length: {
    $jmespath: "length(input.products)",
  },
  input_split: {
    $jmespath:
      "zip_map(&{need:@[0],products:[@[1]]}, [repeat(input.need, length(input.products)), input.products])",
  },
  input_merge: {
    $jmespath: "@.{need:input[0].need, products:input[].products[0]}",
  },
};

export const Profile: Functions.RemoteProfile = {
  description:
    "Default profile for product-match. Uses ensemble voting for accurate rankings.",
  changelog: null,
  tasks: [
    {
      ensemble: {
        llms: [
          {
            model: "openai/gpt-4.1-nano",
            output_mode: "json_schema",
          },
          {
            model: "google/gemini-2.5-flash-lite",
            output_mode: "json_schema",
          },
          {
            model: "x-ai/grok-4.1-fast",
            output_mode: "json_schema",
            reasoning: {
              enabled: false,
            },
          },
          {
            model: "openai/gpt-4o-mini",
            output_mode: "json_schema",
            top_logprobs: 20,
          },
          {
            model: "deepseek/deepseek-v3.2",
            output_mode: "instruction",
            top_logprobs: 20,
          },
        ],
      },
      profile: [1.0, 1.0, 1.0, 1.0, 1.0],
    },
  ],
};

export const ExampleInputs: ExampleInput[] = [
  // Example 1: Clear winner - lightweight laptop
  {
    value: {
      need: "A lightweight laptop for frequent travel with long battery life",
      products: [
        {
          name: "MacBook Air M3",
          description:
            "13.6-inch Retina display, M3 chip, 1.24kg, 18-hour battery life, fanless design",
        },
        {
          name: "Dell XPS 15",
          description:
            "15.6-inch OLED display, Intel Core i7, 1.86kg, 13-hour battery, powerful GPU",
        },
        {
          name: "Lenovo ThinkPad X1 Carbon",
          description:
            "14-inch display, Intel Core Ultra, 1.12kg, 15-hour battery, military-grade durability",
        },
      ],
    },
    compiledTasks: [
      {
        type: "vector.completion",
        skipped: false,
        mapped: null,
      },
    ],
    outputLength: 3,
  },
  // Example 2: Gaming focus
  {
    value: {
      need: "High-performance gaming laptop with best graphics",
      products: [
        {
          name: "ASUS ROG Strix",
          description:
            "17.3-inch 240Hz display, RTX 4080, Intel i9, 32GB RAM, RGB lighting",
        },
        {
          name: "MacBook Pro 16",
          description:
            "16-inch Liquid Retina XDR, M3 Max chip, 48GB unified memory, 22-hour battery",
        },
        {
          name: "HP Pavilion",
          description:
            "15.6-inch FHD, Intel i5, 8GB RAM, integrated graphics, budget-friendly",
        },
      ],
    },
    compiledTasks: [
      {
        type: "vector.completion",
        skipped: false,
        mapped: null,
      },
    ],
    outputLength: 3,
  },
  // Example 3: Budget phone
  {
    value: {
      need: "Affordable smartphone under $300 with good camera",
      products: [
        {
          name: "Google Pixel 8a",
          description:
            "6.1-inch OLED, Tensor G3, 64MP camera, 7 years of updates, $499",
        },
        {
          name: "Samsung Galaxy A35",
          description:
            "6.6-inch AMOLED, 50MP camera, 5000mAh battery, water resistant, $299",
        },
        {
          name: "iPhone 15 Pro",
          description:
            "6.1-inch Super Retina XDR, A17 Pro chip, 48MP camera, titanium design, $999",
        },
        {
          name: "Motorola Moto G Power",
          description:
            "6.5-inch IPS LCD, 50MP camera, 5000mAh battery, Android 14, $199",
        },
      ],
    },
    compiledTasks: [
      {
        type: "vector.completion",
        skipped: false,
        mapped: null,
      },
    ],
    outputLength: 4,
  },
  // Example 4: Two products - headphones comparison
  {
    value: {
      need: "Wireless noise-cancelling headphones for commuting",
      products: [
        {
          name: "Sony WH-1000XM5",
          description:
            "Industry-leading noise cancellation, 30-hour battery, multipoint connection, premium sound",
        },
        {
          name: "Bose QuietComfort Ultra",
          description:
            "Spatial audio, 24-hour battery, comfortable fit, CustomTune technology",
        },
      ],
    },
    compiledTasks: [
      {
        type: "vector.completion",
        skipped: false,
        mapped: null,
      },
    ],
    outputLength: 2,
  },
  // Example 5: Kitchen appliance - evenly matched
  {
    value: {
      need: "Espresso machine for home use",
      products: [
        {
          name: "Breville Barista Express",
          description:
            "Built-in grinder, 15-bar pressure, milk frother, programmable settings",
        },
        {
          name: "De'Longhi Magnifica",
          description:
            "Automatic bean-to-cup, 15-bar pressure, adjustable milk frother, compact design",
        },
      ],
    },
    compiledTasks: [
      {
        type: "vector.completion",
        skipped: false,
        mapped: null,
      },
    ],
    outputLength: 2,
  },
  // Example 6: Fitness tracker - specific need
  {
    value: {
      need: "Fitness watch for marathon training with GPS and heart rate monitoring",
      products: [
        {
          name: "Garmin Forerunner 965",
          description:
            "AMOLED display, multi-band GPS, advanced running dynamics, 23-day battery",
        },
        {
          name: "Apple Watch Series 9",
          description:
            "Always-on Retina display, ECG, blood oxygen, crash detection, 18-hour battery",
        },
        {
          name: "Fitbit Charge 6",
          description:
            "AMOLED display, built-in GPS, heart rate, stress management, 7-day battery",
        },
        {
          name: "Casio G-Shock",
          description:
            "Shock resistant, 200m water resistant, world time, solar powered, no GPS",
        },
      ],
    },
    compiledTasks: [
      {
        type: "vector.completion",
        skipped: false,
        mapped: null,
      },
    ],
    outputLength: 4,
  },
  // Example 7: Office chair - ergonomic focus
  {
    value: {
      need: "Ergonomic office chair for long work days with lumbar support",
      products: [
        {
          name: "Herman Miller Aeron",
          description:
            "Adjustable PostureFit SL lumbar, breathable mesh, 12-year warranty, multiple sizes",
        },
        {
          name: "Secretlab Titan",
          description:
            "Gaming chair, 4-way lumbar support, cold-cure foam, magnetic armrests",
        },
        {
          name: "IKEA Markus",
          description:
            "High back, mesh, built-in lumbar, 10-year warranty, budget-friendly",
        },
      ],
    },
    compiledTasks: [
      {
        type: "vector.completion",
        skipped: false,
        mapped: null,
      },
    ],
    outputLength: 3,
  },
  // Example 8: Camera - professional use
  {
    value: {
      need: "Professional camera for wildlife photography",
      products: [
        {
          name: "Sony A1",
          description:
            "50.1MP, 30fps continuous, real-time tracking, 8K video, dual card slots",
        },
        {
          name: "Canon EOS R5",
          description:
            "45MP, 20fps, animal eye AF, 8K video, in-body stabilization",
        },
        {
          name: "GoPro Hero 12",
          description:
            "5.3K video, waterproof, hypersmooth stabilization, compact action camera",
        },
        {
          name: "iPhone 15 Pro Max",
          description:
            "48MP main camera, 5x optical zoom, ProRAW, Action mode video",
        },
        {
          name: "Nikon Z8",
          description:
            "45.7MP, 20fps, subject detection AI, 8K video, weather sealed",
        },
      ],
    },
    compiledTasks: [
      {
        type: "vector.completion",
        skipped: false,
        mapped: null,
      },
    ],
    outputLength: 5,
  },
  // Example 9: Vacuum cleaner - pet owner
  {
    value: {
      need: "Vacuum cleaner for home with multiple pets and allergies",
      products: [
        {
          name: "Dyson V15 Detect",
          description:
            "Laser dust detection, HEPA filtration, powerful suction, LCD screen, cordless",
        },
        {
          name: "Roomba j7+",
          description:
            "Robot vacuum, self-emptying, obstacle avoidance, smart mapping, pet hair pickup",
        },
        {
          name: "Shark Navigator",
          description:
            "Upright vacuum, anti-allergen seal, pet power brush, affordable, corded",
        },
      ],
    },
    compiledTasks: [
      {
        type: "vector.completion",
        skipped: false,
        mapped: null,
      },
    ],
    outputLength: 3,
  },
  // Example 10: Electric vehicle
  {
    value: {
      need: "Electric car for family with long range and safety features",
      products: [
        {
          name: "Tesla Model Y",
          description:
            "330-mile range, Autopilot, 5-star safety, 76 cu ft cargo, Supercharger network",
        },
        {
          name: "Ford Mustang Mach-E",
          description:
            "312-mile range, BlueCruise, co-pilot360, 59 cu ft cargo, Ford charging network",
        },
        {
          name: "Porsche Taycan",
          description:
            "246-mile range, 0-60 in 2.6s, luxury interior, sport performance focus",
        },
        {
          name: "Rivian R1S",
          description:
            "321-mile range, 7 seats, off-road capable, adventure-focused, quad motor option",
        },
      ],
    },
    compiledTasks: [
      {
        type: "vector.completion",
        skipped: false,
        mapped: null,
      },
    ],
    outputLength: 4,
  },
];
