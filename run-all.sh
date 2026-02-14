#!/bin/bash
set -e

# Configuration
OUTPUT_DIR="generated/myservice-main"
FIGMA_NODE_JSON="$OUTPUT_DIR/figma-node.json"
DESIGN_IR_JSON="$OUTPUT_DIR/design-ir.json"
SPECS_DIR="$OUTPUT_DIR/specs"
BACKEND_DIR="$OUTPUT_DIR/backend"

echo "=================================================="
echo "🚀 Starting SpecForge Pipeline (Design to Code)"
echo "=================================================="

# Check for .env
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# 0. Build Packages
echo "📦 Building packages..."
npm run build --workspace=packages/design-parser
npm run build --workspace=packages/spec-gen
npm run build --workspace=packages/backend-cli

# 1. Extract
echo "📥 [1/4] Extracting Node from Figma..."
NODE_ID="9068:200269" # MyService > Main (Dealer)
npx tsx packages/figma-reader/src/extract-node.ts "$NODE_ID" "$FIGMA_NODE_JSON"

# 2. Parse
echo "🧠 [2/4] Parsing Design to IR..."
npx tsx packages/design-parser/src/run-parser.ts "$FIGMA_NODE_JSON" "$DESIGN_IR_JSON"

# 3. Spec Gen
echo "📝 [3/4] Generating Specifications..."
npx tsx packages/spec-gen/src/run-spec-gen.ts "$DESIGN_IR_JSON" "$SPECS_DIR"

# 4. Code Gen
echo "💻 [4/4] Generating Spring Boot Backend..."
npx tsx packages/backend-cli/src/generate-manual.ts \
    "$SPECS_DIR/openapi.json" \
    "$SPECS_DIR/schema.json" \
    "$BACKEND_DIR"

echo "=================================================="
echo "✅ Pipeline Completed Successfully!"
echo "📂 Output: $BACKEND_DIR"
echo "Note: You can run the backend with 'cd $BACKEND_DIR && ./gradlew bootRun'"
echo "=================================================="
