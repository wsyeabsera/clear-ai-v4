/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

module.exports = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['intro', 'getting-started/installation', 'getting-started/quick-start', 'getting-started/architecture-overview', 'getting-started/environment-setup'],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: ['core-concepts/tool-chaining', 'core-concepts/llm-integration', 'core-concepts/mcp-server', 'core-concepts/agents'],
    },
    {
      type: 'category',
      label: 'Tutorials',
      items: ['tutorials/first-plan', 'tutorials/executing-plans', 'tutorials/custom-tools', 'tutorials/llm-customization'],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: ['api-reference/planner-agent', 'api-reference/executor-agent', 'api-reference/shared-types', 'api-reference/tools'],
    },
    {
      type: 'category',
      label: 'Advanced Topics',
      items: ['advanced/parameter-resolution', 'advanced/dependency-analysis', 'advanced/error-handling', 'advanced/performance'],
    },
  ],
};

