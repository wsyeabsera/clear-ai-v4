#!/bin/bash
# Fix cross-section links to use relative paths

# Fix from getting-started to other sections
sed -i '' 's|(installation)|(./installation.md)|g' getting-started/quick-start.md
sed -i '' 's|(quick-start)|(./quick-start.md)|g' getting-started/*.md
sed -i '' 's|(tutorials/first-plan)|(../tutorials/first-plan)|g' getting-started/quick-start.md
sed -i '' 's|(api-reference/planner-agent)|(../api-reference/planner-agent)|g' getting-started/quick-start.md
sed -i '' 's|(advanced/parameter-resolution)|(../advanced/parameter-resolution)|g' getting-started/quick-start.md
sed -i '' 's|(core-concepts/tool-chaining)|(../core-concepts/tool-chaining)|g' getting-started/environment-setup.md
sed -i '' 's|(core-concepts/llm-integration)|(../core-concepts/llm-integration)|g' getting-started/environment-setup.md getting-started/architecture-overview.md

# Fix from core-concepts to other sections
sed -i '' 's|(tool-chaining)|(./tool-chaining.md)|g' core-concepts/*.md
sed -i '' 's|(mcp-server)|(./mcp-server.md)|g' core-concepts/llm-integration.md
sed -i '' 's|(advanced)|(../advanced)|g' core-concepts/llm-integration.md
sed -i '' 's|(advanced/parameter-resolution)|(../advanced/parameter-resolution)|g' core-concepts/llm-integration.md
sed -i '' 's|(agents)|(./agents.md)|g' core-concepts/mcp-server.md
sed -i '' 's|(tool-chaining)|(./tool-chaining.md)|g' core-concepts/mcp-server.md
sed -i '' 's|(api-reference/tools)|(../api-reference/tools)|g' core-concepts/mcp-server.md
sed -i '' 's|(getting-started/quick-start)|(../getting-started/quick-start)|g' core-concepts/agents.md

# Fix tutorial references
sed -i '' 's|(getting-started/quick-start)|(../getting-started/quick-start)|g' tutorials/*.md

# Fix intro
sed -i '' 's|(getting-started/installation)|(./getting-started/installation)|g' intro.md

echo "Links fixed"
