/**
 * Experiment scratchpad for product-match function
 *
 * Run with: npm run start
 */

import { Function, Profile, ExampleInputs } from "./defs";
import { ObjectiveAI, Functions } from "objectiveai";
import { ChildProcess, spawn } from "child_process";
import process from "process";
import "dotenv/config";

// Type for our function's input
interface ProductMatchInput {
  need: string;
  products: { name: string; description: string }[];
}

function spawnApiServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const apiProcess = spawn(
      "cargo",
      ["run", "--manifest-path", "./objectiveai/objectiveai-api/Cargo.toml"],
      {
        detached: false,
        stdio: ["inherit", "pipe", "pipe"],
      }
    );

    const killApiProcess = () => {
      if (!apiProcess.killed) {
        try {
          process.kill(apiProcess.pid as number);
        } catch {}
      }
    };

    process.on("exit", killApiProcess);
    process.on("SIGINT", () => {
      killApiProcess();
      process.exit(130);
    });
    process.on("SIGTERM", () => {
      killApiProcess();
      process.exit(143);
    });
    process.on("uncaughtException", (err) => {
      killApiProcess();
      throw err;
    });
    process.on("unhandledRejection", (err) => {
      killApiProcess();
      throw err;
    });

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        killApiProcess();
        reject(
          new Error("Timeout: API server did not start within 300 seconds")
        );
      }
    }, 300000);

    const onData = (data: Buffer) => {
      const output = data.toString();
      if (!resolved && output.includes("Running `")) {
        resolved = true;
        clearTimeout(timeout);
        resolve(apiProcess);
      }
    };

    apiProcess.stdout?.on("data", onData);
    apiProcess.stderr?.on("data", onData);

    apiProcess.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    apiProcess.on("exit", (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(
          new Error(
            `API server exited with code ${code} before becoming ready`
          )
        );
      }
    });
  });
}

const objectiveai = new ObjectiveAI({
  apiBase: `http://${process.env.ADDRESS ?? "localhost"}:${process.env.PORT ?? 5000}`,
});

async function runExample(index: number) {
  const example = ExampleInputs[index];
  const input = example.value as unknown as ProductMatchInput;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Example ${index + 1}: ${input.need}`);
  console.log(`Products: ${input.products.map((p: { name: string }) => p.name).join(", ")}`);
  console.log(`${"=".repeat(60)}\n`);

  const result = await Functions.Executions.inlineFunctionInlineProfileCreate(
    objectiveai,
    {
      input: example.value,
      function: Function,
      profile: Profile,
      from_rng: true, // Use RNG for testing (no actual LLM calls)
    }
  );

  if (result.error) {
    console.error("Execution error:", result.error);
    return;
  }

  console.log("Scores:");
  const products = input.products;
  const scores = result.output as number[];

  // Sort by score descending
  const ranked = products
    .map((p: { name: string }, i: number) => ({ name: p.name, score: scores[i] }))
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

  ranked.forEach((item: { name: string; score: number }, rank: number) => {
    const bar = "█".repeat(Math.round(item.score * 40));
    console.log(`  ${rank + 1}. ${item.name.padEnd(25)} ${(item.score * 100).toFixed(1)}% ${bar}`);
  });
}

async function compileExample(index: number) {
  const example = ExampleInputs[index];
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Compiling Example ${index + 1}`);
  console.log(`${"=".repeat(60)}\n`);

  // Compile tasks to see what prompts are generated
  const compiledTasks = Functions.compileFunctionTasks(Function, example.value);
  console.log("Compiled Tasks:");
  console.log(JSON.stringify(compiledTasks, null, 2));

  // Compile output length
  const outputLength = Functions.compileFunctionOutputLength(Function, example.value);
  console.log(`\nOutput Length: ${outputLength}`);
}

async function main() {
  console.log("Product Match Function - Experiment Scratchpad\n");

  // Show function info
  console.log("Function Type:", Function.type);
  console.log("Description:", Function.description);
  console.log("Changelog:", Function.changelog);
  console.log(`\nExample Inputs: ${ExampleInputs.length}`);

  // Compile first example to show prompt structure
  await compileExample(0);

  // Spawn API server
  console.log("\nStarting API server...");
  const apiProcess = await spawnApiServer();
  console.log("API server ready!\n");

  // Run first example
  await runExample(0);

  // Kill server when done
  apiProcess.kill();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
