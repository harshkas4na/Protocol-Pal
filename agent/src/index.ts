import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ToolboxService } from '@nullshot/agent';
import { 
  stepCountIs, 
  type LanguageModel, 
  type Provider,
} from 'ai';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { AiSdkAgent, AIUISDKMessage, type MCPConfig} from '@nullshot/agent';
import mcpConfig from '../mcp.json'

// --- Hono App ---
const app = new Hono<{ Bindings: Env }>();
app.use(
    '*',
    cors({
        origin: '*', 
        allowMethods: ['POST', 'GET', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
        exposeHeaders: ['X-Session-Id'],
        maxAge: 86400,
    }),
);

app.all('/agent/chat/:sessionId?', async (c) => {
    const { AGENT } = c.env;
    var sessionIdStr = c.req.param('sessionId');
    if (!sessionIdStr || sessionIdStr == '') {
        sessionIdStr = crypto.randomUUID();
    }
    const id = AGENT.idFromName(sessionIdStr);
    const forwardRequest = new Request('https://internal.com/agent/chat/' + sessionIdStr, {
        method: c.req.method,
        body: c.req.raw.body,
    });
    return await AGENT.get(id).fetch(forwardRequest);
});

// --- Chat Agent Class ---
export class SimplePromptAgent extends AiSdkAgent<Env> {

  constructor(state: DurableObjectState, env: Env) {
    let provider: Provider;
    let model: LanguageModel;
    switch (env.AI_PROVIDER) {
      case "google":
        provider = createGoogleGenerativeAI({
          apiKey: env.AI_PROVIDER_API_KEY,
        });
        model = provider.languageModel(env.MODEL_ID || "gemini-2.5-flash");
        break;
      default:
        throw new Error(`Unsupported AI provider: ${env.AI_PROVIDER}`);
    }
    
    super(state, env, model, [new ToolboxService(env, mcpConfig)]);
    
    console.log('[ChatAgent] Initialized with MCP config');
  }

  async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<Response> {
    try {
      console.log('[ChatAgent] Received messages:', JSON.stringify(messages, null, 2));
      
      // Handle the case where messages might be structured differently
      let messageArray;
      
      if (messages.messages && Array.isArray(messages.messages)) {
        // Standard format: { messages: [...] }
        messageArray = messages.messages;
      } else if (Array.isArray(messages)) {
        // Direct array format
        messageArray = messages;
      } else {
        // Fallback: try to extract message from any format
        console.error('[ChatAgent] Unexpected message format:', messages);
        throw new Error('Invalid message format received');
      }

      if (!messageArray || messageArray.length === 0) {
        throw new Error('No messages provided');
      }

      console.log('[ChatAgent] Processing message array:', JSON.stringify(messageArray, null, 2));

      // Extract user address from the latest message
      const latestMessage = messageArray[messageArray.length - 1];
      const userAddress = latestMessage.userAddress || latestMessage.metadata?.userAddress;

      if (userAddress) {
        console.log('[ChatAgent] User address found:', userAddress);
      }

      // Stream the response with tool support
      const result = await this.streamTextWithMessages(
        sessionId,
        messageArray,
        {
          system: `You are a friendly and helpful Web3 assistant. You can have casual conversations with users and help them with blockchain transactions.

When users ask you to perform blockchain operations (like swapping tokens, minting NFTs, etc.), you have access to a tool called "prepare_natural_language_transaction" that can help prepare these transactions.You can give the ${latestMessage} as the query input to it.
        NOTE : ${userAddress} is to be used as the wallet address.

CRITICAL INSTRUCTIONS FOR TOOL RESPONSES:
When you receive a response from the prepare_natural_language_transaction tool, you MUST output EXACTLY this format:

{
  "type": "contractCall",
  "message": "I've prepared your transaction. Please review and confirm:",
  "transaction": <copy the entire "transaction" object from the tool response>,
  "requiresApproval": <copy the "requiresApproval" value from tool response>,
  "approvalTransaction": <copy the entire "approvalTransaction" object from tool response if it exists, otherwise null>
}

DO NOT add any extra text, explanation, or markdown. ONLY output the JSON.

Key behaviors:
- Be conversational and friendly in regular chat
- When a user requests a blockchain operation, call the prepare_natural_language_transaction tool with their query and wallet address
- After receiving the tool response, output ONLY the JSON format above
- For regular conversation, respond normally without using tools

Examples of requests you should handle with the tool:
- "swap 0.01 eth for usdc"
- "mint 2 nfts"
- "trade 100 USDC for DAI"
- "swap 50 usdc for eth"`,
          maxSteps: 10,
          stopWhen: stepCountIs(10),
          experimental_toolCallStreaming: true,
          onError: (error: unknown) => {
            console.error("[ChatAgent] Error in streamTextWithMessages:", error);
          }
        },
      );

      // Return the streaming response
      return result.toTextStreamResponse();
      
    } catch (error) {
      console.error('[ChatAgent] Error processing message:', error);
      
      // Return a proper error response
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
}

// --- Default Export ---
export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        return app.fetch(request, env, ctx);
    },
};