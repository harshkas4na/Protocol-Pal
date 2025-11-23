import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';


export function setupServerTools(server: McpServer) {
  // Configuration for the IntentParserAgent endpoint
  const INTENT_PARSER_AGENT_URL = 'http://localhost:54082/agent/chat';
  const REQUEST_TIMEOUT_MS = 30000;

  // Sepolia RPC endpoint
  const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/demo";

  // --- Contract ABIs ---
  const ERC20_ABI = [
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;

  const UNISWAP_ABI = [
    {
      inputs: [
        { internalType: "uint256", name: "amountOutMin", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapExactETHForTokens",
      outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "uint256", name: "amountOutMin", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapExactTokensForETH",
      outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "uint256", name: "amountOutMin", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapExactTokensForTokens",
      outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;

  const NFT_DROP_ABI = [
    {
      inputs: [
        { internalType: "address", name: "_receiver", type: "address" },
        { internalType: "uint256", name: "_quantity", type: "uint256" },
        { internalType: "address", name: "_currency", type: "address" },
        { internalType: "uint256", name: "_pricePerToken", type: "uint256" },
        {
          components: [
            { internalType: "bytes32[]", name: "proof", type: "bytes32[]" },
            { internalType: "uint256", name: "quantityLimitPerWallet", type: "uint256" },
            { internalType: "uint256", name: "pricePerToken", type: "uint256" },
            { internalType: "address", name: "currency", type: "address" },
          ],
          internalType: "struct IClaimCondition.AllowlistProof",
          name: "_allowlistProof",
          type: "tuple",
        },
        { internalType: "bytes", name: "_data", type: "bytes" },
      ],
      name: "claim",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
  ] as const;

  // Contract addresses
  const CONTRACT_ADDRESSES = {
    UNISWAP_ROUTER: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
    NFT_DROP: "0x12f8e37677b8934FE4F21E1fE87e18152408e77d"
  };

  // Token addresses on Sepolia
  const TOKEN_ADDRESSES = {
    WETH: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
    USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    DAI: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    USDT: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    LINK: "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5",
    UNI: "0x4c4d5DFF92B35Df3293c46ACdf58FE0674940b64"
  };

  /**
   * Replace placeholder values in args with actual values
   */
  function replacePlaceholders(args: any[], userAddress: string): any[] {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const deadlineTimestamp = currentTimestamp + 600; // 10 minutes from now

    return args.map(arg => {
      if (arg === "[USER_WALLET_ADDRESS]") {
        return userAddress;
      }
      if (arg === "[CURRENT_TIMESTAMP_PLUS_600S]") {
        return deadlineTimestamp;
      }
      // Handle nested arrays (like the path array in swaps)
      if (Array.isArray(arg)) {
        return replacePlaceholders(arg, userAddress);
      }
      // Handle nested objects (like allowlist proofs)
      if (typeof arg === 'object' && arg !== null) {
        const newObj: any = {};
        for (const key in arg) {
          newObj[key] = arg[key] === "[USER_WALLET_ADDRESS]"
            ? userAddress
            : arg[key] === "[CURRENT_TIMESTAMP_PLUS_600S]"
              ? deadlineTimestamp
              : arg[key];
        }
        return newObj;
      }
      return arg;
    });
  }

  /**
   * Get the appropriate ABI for the contract
   */
  function getABI(contractKey: string, functionName?: string): any[] {
    switch (contractKey) {
      case "UNISWAP_ROUTER":
        // If a specific function is requested, return only that function's ABI
        if (functionName) {
          const functionAbi = UNISWAP_ABI.find(item => item.name === functionName);
          return functionAbi ? [functionAbi] : [...UNISWAP_ABI];
        }
        return [...UNISWAP_ABI];
      case "NFT_DROP":
        return [...NFT_DROP_ABI];
      default:
        throw new Error(`Unknown contract key: ${contractKey}`);
    }
  }

  // ===================================
  // TOOL 1: Check Wallet Balance
  // ===================================
  server.tool(
    'check_wallet_balance',
    'Check the native ETH balance and ERC20 token balances for a wallet address on Sepolia testnet. Supports WETH, USDC, DAI, USDT, LINK, and UNI tokens.',
    {
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format").describe(
        "The wallet address to check balances for (must be a valid Ethereum address)"
      ),
      tokens: z.array(z.enum(['WETH', 'USDC', 'DAI', 'USDT', 'LINK', 'UNI'])).optional().describe(
        "Specific tokens to check. If not provided, checks all supported tokens"
      )
    },
    async ({ walletAddress, tokens }) => {
      console.log(`[BalanceTool] Checking balances for ${walletAddress}`);

      const tokensToCheck = tokens || ['WETH', 'USDC', 'DAI', 'USDT', 'LINK', 'UNI'];
      const balances: any = {};

      try {
        // 1. Check native ETH balance
        const ethBalanceResponse = await fetch(SEPOLIA_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [walletAddress, 'latest'],
            id: 1
          })
        });

        const ethBalanceData: unknown = await ethBalanceResponse.json();

        if (
          typeof ethBalanceData === 'object' &&
          ethBalanceData !== null &&
          'result' in ethBalanceData &&
          typeof (ethBalanceData as any).result === 'string'
        ) {
          const ethBalanceWei = BigInt((ethBalanceData as any).result);
          const ethBalance = Number(ethBalanceWei) / 1e18;
          balances.ETH = {
            balance: ethBalance.toFixed(6),
            raw: ethBalanceData.result,
            symbol: 'ETH',
            decimals: 18
          };
          console.log(`[BalanceTool] ETH Balance: ${ethBalance.toFixed(6)}`);
        }

        // 2. Check ERC20 token balances
        for (const tokenSymbol of tokensToCheck) {
          const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];

          if (!tokenAddress) {
            console.warn(`[BalanceTool] Unknown token: ${tokenSymbol}`);
            continue;
          }

          try {
            // Encode balanceOf(address) call: 0x70a08231 + padded address
            const balanceOfData = '0x70a08231' + walletAddress.slice(2).padStart(64, '0');

            // Call balanceOf
            const balanceResponse = await fetch(SEPOLIA_RPC_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                  to: tokenAddress,
                  data: balanceOfData
                }, 'latest'],
                id: 2
              })
            });

            const balanceData: unknown = await balanceResponse.json();

            if (
              typeof balanceData === 'object' &&
              balanceData !== null &&
              'result' in balanceData &&
              typeof (balanceData as any).result === 'string' &&
              (balanceData as any).result !== '0x'
            ) {
              // Get token decimals (most are 18, but USDC/USDT are 6)
              const decimalsData = '0x313ce567'; // decimals()
              const decimalsResponse = await fetch(SEPOLIA_RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_call',
                  params: [{
                    to: tokenAddress,
                    data: decimalsData
                  }, 'latest'],
                  id: 3
                })
              });
              const decimalsJson: unknown = await decimalsResponse.json();
              const decimals = (typeof decimalsJson === 'object' && decimalsJson !== null && 'result' in decimalsJson && typeof (decimalsJson as any).result === 'string')
                ? parseInt((decimalsJson as any).result, 16)
                : 18;

              const balanceWei = typeof balanceData === 'object' && balanceData !== null && 'result' in balanceData
                ? BigInt((balanceData as any).result)
                : BigInt(0);
              const balance = Number(balanceWei) / Math.pow(10, decimals);
              balances[tokenSymbol] = {
                balance: balance.toFixed(decimals === 6 ? 2 : 6),
                raw: (typeof balanceData === 'object' && balanceData !== null && 'result' in balanceData)
                  ? (balanceData as any).result
                  : '0x0',
                symbol: tokenSymbol,
                decimals: decimals,
                address: tokenAddress
              };

              console.log(`[BalanceTool] ${tokenSymbol} Balance: ${balance.toFixed(decimals === 6 ? 2 : 6)}`);
            } else {
              balances[tokenSymbol] = {
                balance: '0',
                raw: '0x0',
                symbol: tokenSymbol,
                decimals: 18,
                address: tokenAddress
              };
            }
          } catch (tokenError) {
            console.error(`[BalanceTool] Error checking ${tokenSymbol}:`, tokenError);
            balances[tokenSymbol] = {
              error: tokenError instanceof Error ? tokenError.message : 'Unknown error',
              symbol: tokenSymbol,
              address: tokenAddress
            };
          }
        }

        // Format response message
        let responseText = `Wallet Balance for ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n\n`;
        responseText += `Native ETH:\n`;
        responseText += `• ${balances.ETH.balance} ETH\n\n`;
        responseText += `ERC20 Tokens:\n`;

        for (const token of tokensToCheck) {
          if (balances[token] && !balances[token].error) {
            responseText += `• ${balances[token].balance} ${token}\n`;
          } else if (balances[token]?.error) {
            responseText += `• ${token}: Error fetching balance\n`;
          }
        }

        responseText += `\nNetwork: Sepolia Testnet`;

        return {
          content: [{
            type: "text",
            text: responseText
          }],
          balances,
          walletAddress,
          network: 'sepolia',
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        console.error('[BalanceTool] Error:', error);
        return {
          content: [{
            type: "text",
            text: `Error checking balances: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  // ===================================
  // TOOL 3: Prepare Natural Language Transaction
  // ===================================
  server.tool(
    'prepare_natural_language_transaction',
    'Parses a user\'s natural language request and returns a complete, signable Web3 transaction object. Handles token swaps, NFT minting, and more via the IntentParserAgent microservice.',
    {
      query: z.string().min(1, "Query cannot be empty").describe(
        "The user's natural language request (e.g., 'swap 0.01 eth for usdc')"
      ),
      userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format").describe(
        "The user's connected wallet address (must be a valid Ethereum address)"
      )
    },
    async ({ query, userAddress }) => {
      const startTime = Date.now();

      console.log(`[Web3ToolProvider] Received request: "${query}" for ${userAddress}`);

      try {
        // === STEP 1: Call IntentParserAgent Microservice ===
        console.log(`[Web3ToolProvider] Delegating to IntentParserAgent at ${INTENT_PARSER_AGENT_URL}...`);

        // Create abort controller for timeout
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

        let response: Response;

        try {
          response = await fetch(INTENT_PARSER_AGENT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  id: Date.now().toString(),
                  role: "user",
                  content: query
                }
              ]
            }),
            signal: abortController.signal
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new Error(`Request to IntentParserAgent timed out after ${REQUEST_TIMEOUT_MS}ms`);
          }

          throw new Error(`Failed to connect to IntentParserAgent: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
        }

        clearTimeout(timeoutId);

        // === STEP 2: Handle the Streaming Response ===
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unable to read error response');
          throw new Error(`IntentParserAgent returned error (${response.status}): ${errorText}`);
        }

        // Read the streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body from IntentParserAgent');
        }

        console.log('[Web3ToolProvider] Reading streaming response...');

        const decoder = new TextDecoder();
        let agentMessage = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            agentMessage += chunk;
          }
        } finally {
          // Always release the reader
          reader.releaseLock();
        }

        console.log('[Web3ToolProvider] Full agent response:', agentMessage);

        // === STEP 3: Parse the JSON Response ===
        let agentResponse;
        try {
          // Remove markdown backticks if present
          const jsonString = agentMessage
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

          console.log('[Web3ToolProvider] Cleaned JSON string:', jsonString);

          agentResponse = JSON.parse(jsonString);
          console.log('[Web3ToolProvider] Parsed agent response:', JSON.stringify(agentResponse, null, 2));

          // Log specifically if approval fields are present
          if (agentResponse.requires_approval !== undefined) {
            console.log('[Web3ToolProvider] ✓ Approval fields detected:', {
              requires_approval: agentResponse.requires_approval,
              approval_token: agentResponse.approval_token,
              approval_amount: agentResponse.approval_amount
            });
          } else {
            console.log('[Web3ToolProvider] ⚠️ No approval fields in agent response');
          }
        } catch (jsonError) {
          console.error('[Web3ToolProvider] Failed to parse JSON:', agentMessage);
          throw new Error(`IntentParserAgent returned invalid JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown parse error'}`);
        }

        // === STEP 4: Check for Agent Errors ===
        if (agentResponse.error) {
          console.error('[Web3ToolProvider] Agent returned error:', agentResponse.error);
          return {
            content: [{
              type: "text",
              text: `Agent Error: ${agentResponse.error}`
            }],
            isError: true
          };
        }

        // === STEP 5: Validate Required Fields ===
        if (!agentResponse.action || agentResponse.action !== 'prepare_transaction') {
          throw new Error('Invalid agent response: missing or invalid action field');
        }

        if (!agentResponse.contract_key || !agentResponse.function_name || !agentResponse.args) {
          throw new Error('Invalid agent response: missing required transaction fields');
        }

        // === STEP 6: Replace Placeholders with Actual Values ===
        const processedArgs = replacePlaceholders(agentResponse.args, userAddress);
        console.log('[Web3ToolProvider] Processed args:', JSON.stringify(processedArgs, null, 2));

        // === STEP 7: Get Contract Address and ABI ===
        const contractAddress = CONTRACT_ADDRESSES[agentResponse.contract_key as keyof typeof CONTRACT_ADDRESSES];
        if (!contractAddress) {
          throw new Error(`Unknown contract key: ${agentResponse.contract_key}`);
        }

        const abi = getABI(agentResponse.contract_key, agentResponse.function_name);

        // === STEP 8: Check if Approval is Needed ===
        let approvalTransaction = null;

        // Check if the agent explicitly said approval is needed
        const needsApproval = agentResponse.requires_approval === true;

        // OR detect based on function name (fallback if agent doesn't specify)
        const isTokenSwap = agentResponse.function_name === "swapExactTokensForETH" ||
          agentResponse.function_name === "swapExactTokensForTokens";

        if (needsApproval || isTokenSwap) {
          console.log('[Web3ToolProvider] Approval required detected');

          // Get approval token and amount
          let approvalToken = agentResponse.approval_token;
          let approvalAmount = agentResponse.approval_amount;

          // Fallback: extract from args if not explicitly provided
          if (!approvalToken || !approvalAmount) {
            console.log('[Web3ToolProvider] Approval fields missing, extracting from args...');

            // For token swaps, first arg is amountIn and first element in path is the input token
            if (processedArgs.length >= 3 && Array.isArray(processedArgs[2])) {
              approvalAmount = processedArgs[0].toString(); // amountIn
              approvalToken = processedArgs[2][0]; // First token in path

              console.log('[Web3ToolProvider] Extracted approval info:', {
                token: approvalToken,
                amount: approvalAmount
              });
            }
          }

          if (approvalToken && approvalAmount) {
            approvalTransaction = {
              contract_address: approvalToken,
              function_name: "approve",
              args: [contractAddress, approvalAmount], // Approve Uniswap Router to spend tokens
              value: "0.0",
              abi: [...ERC20_ABI]
            };

            console.log('[Web3ToolProvider] Approval transaction prepared:', JSON.stringify(approvalTransaction, null, 2));
          } else {
            console.warn('[Web3ToolProvider] Could not determine approval parameters');
          }
        } else {
          console.log('[Web3ToolProvider] No approval required for this transaction');
        }

        const processingTime = Date.now() - startTime;
        console.log(`[Web3ToolProvider] ✓ Successfully processed request in ${processingTime}ms`);

        // === STEP 9: Return Complete Transaction Data with ABI ===
        const completeResponse = {
          success: true,
          requiresApproval: !!approvalTransaction,
          approvalTransaction: approvalTransaction,
          transaction: {
            contract_key: agentResponse.contract_key,
            contract_address: contractAddress,
            function_name: agentResponse.function_name,
            args: processedArgs,
            value: agentResponse.value,
            abi: abi
          },
          userAddress: userAddress,
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString()
        };

        console.log('[Web3ToolProvider] Final response:', JSON.stringify(completeResponse, null, 2));

        return {
          content: [{
            type: "text",
            text: JSON.stringify(completeResponse, null, 2)
          }]
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const processingTime = Date.now() - startTime;

        console.error(`[Web3ToolProvider] ✗ Error after ${processingTime}ms:`, errorMessage);

        // Return user-friendly error response
        return {
          content: [{
            type: "text",
            text: `Sorry, I encountered an error while preparing your transaction: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`
          }],
          isError: true
        };
      }
    }
  );
}