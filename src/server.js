import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  TextContent,
  ImageContent,
  EmbeddedResourceSchema,
  LoggingLevelSchema
} from '@modelcontextprotocol/sdk/types.js';
import { RishadStyleAnalyzer } from './rishad-analyzer.js';
import { StyleTransformer } from './style-transformer.js';
import { ContentAnalyzer } from './content-analyzer.js';
import dotenv from 'dotenv';

dotenv.config();

class RishadMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'rishad-ai-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.analyzer = new RishadStyleAnalyzer();
    this.transformer = new StyleTransformer();
    this.contentAnalyzer = new ContentAnalyzer();

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // Tool 1: Analyze content in Rishad's style
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_content_rishad_style',
            description: 'Analyze any content using Rishad Tobaccowala\'s perspective and writing style',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The content to analyze'
                },
                analysis_type: {
                  type: 'string',
                  enum: ['marketing', 'business', 'technology', 'general'],
                  description: 'Type of analysis to perform'
                }
              },
              required: ['content']
            }
          },
          {
            name: 'transform_to_rishad_style',
            description: 'Transform content to match Rishad Tobaccowala\'s writing style and tone',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The content to transform'
                },
                preserve_meaning: {
                  type: 'boolean',
                  description: 'Whether to preserve the original meaning while changing style',
                  default: true
                }
              },
              required: ['content']
            }
          },
          {
            name: 'get_rishad_insights',
            description: 'Get insights and analysis on a topic from Rishad\'s perspective',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'The topic to get insights on'
                },
                context: {
                  type: 'string',
                  description: 'Additional context for the analysis'
                }
              },
              required: ['topic']
            }
          },
          {
            name: 'train_on_rishad_content',
            description: 'Train the model on new Rishad Tobaccowala content',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'New content from Rishad to train on'
                },
                source: {
                  type: 'string',
                  description: 'Source of the content (e.g., blog, tweet, interview)'
                }
              },
              required: ['content']
            }
          }
        ]
      };
    });

    // Tool 2: Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        switch (name) {
          case 'analyze_content_rishad_style':
            result = await this.analyzer.analyzeContent(args.content, args.analysis_type);
            break;

          case 'transform_to_rishad_style':
            result = await this.transformer.transformContent(args.content, args.preserve_meaning);
            break;

          case 'get_rishad_insights':
            result = await this.analyzer.getInsights(args.topic, args.context);
            break;

          case 'train_on_rishad_content':
            result = await this.analyzer.trainOnContent(args.content, args.source);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: result
            }
          ]
        };
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Rishad AI MCP Server started');
  }
}

// Start the server
const server = new RishadMCPServer();
server.run().catch(console.error); 