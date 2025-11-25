// src/tokenData/service.ts
import { Service, logger } from "@elizaos/core";

class DummyTokenDataService extends Service {
  static serviceType = "token_data";
  capabilityDescription = "Dummy token data service for testing";
  get serviceName() {
    return "dummy-token-data";
  }
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    const service = new DummyTokenDataService(runtime);
    await service.start();
    return service;
  }
  async start() {
    logger.info(`[${this.serviceName}] Service started.`);
  }
  async stop() {
    logger.info(`[${this.serviceName}] Service stopped.`);
  }
  async getTokenData(tokenAddress) {
    return {
      symbol: "DUMMY",
      name: "Dummy Token",
      address: tokenAddress,
      decimals: 18,
      totalSupply: "1000000000",
      priceUsd: 1.23,
      marketCapUsd: 1230000000,
      volume24hUsd: 45600000,
      priceChange24h: 5.67
    };
  }
  async getTokenDataBySymbol(symbol) {
    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol} Token`,
      address: "0xdummy",
      decimals: 18,
      totalSupply: "1000000000",
      priceUsd: 1.23,
      marketCapUsd: 1230000000,
      volume24hUsd: 45600000,
      priceChange24h: 5.67
    };
  }
  async getMultipleTokenData(tokenAddresses) {
    return tokenAddresses.map((address, index) => ({
      symbol: `TOKEN${index}`,
      name: `Token ${index}`,
      address,
      decimals: 18,
      totalSupply: "1000000000",
      priceUsd: 1.23 * (index + 1),
      marketCapUsd: 1230000000 * (index + 1),
      volume24hUsd: 45600000 * (index + 1),
      priceChange24h: 5.67 * (index % 2 === 0 ? 1 : -1)
    }));
  }
  async getTokenDetails(address, chain = "solana") {
    const symbol = address.startsWith("So") ? address.substring(2, 6) : address.substring(0, 4).toUpperCase();
    return {
      id: `${chain}:${address}`,
      symbol,
      name: `Dummy Token ${symbol}`,
      address,
      chain,
      decimals: 18,
      totalSupply: "1000000000",
      price: 1.23 + Math.random() * 10,
      priceUsd: 1.23 + Math.random() * 10,
      marketCapUsd: 1230000000 + Math.random() * 1e9,
      marketCapUSD: 1230000000 + Math.random() * 1e9,
      volume24hUsd: 45600000 + Math.random() * 50000000,
      volume24hUSD: 45600000 + Math.random() * 50000000,
      priceChange24h: -10 + Math.random() * 20,
      priceChange24hPercent: -10 + Math.random() * 20,
      logoURI: "https://via.placeholder.com/150",
      liquidity: 5000000 + Math.random() * 5000000,
      holders: Math.floor(1000 + Math.random() * 9000),
      sourceProvider: "dummy",
      lastUpdatedAt: new Date,
      raw: {
        dummyData: true
      }
    };
  }
  async getTrendingTokens(chain = "solana", limit = 10) {
    const tokens = [];
    for (let i = 0;i < limit; i++) {
      const symbol = `TREND${i + 1}`;
      tokens.push({
        id: `${chain}:0xtrending${i}`,
        symbol,
        name: `Trending Token ${i + 1}`,
        address: `0xtrending${i}`,
        chain,
        decimals: 18,
        totalSupply: "1000000000",
        price: Math.random() * 100,
        priceUsd: Math.random() * 100,
        marketCapUsd: 1e6 + Math.random() * 1e9,
        marketCapUSD: 1e6 + Math.random() * 1e9,
        volume24hUsd: 1e5 + Math.random() * 1e7,
        volume24hUSD: 1e5 + Math.random() * 1e7,
        priceChange24h: -50 + Math.random() * 100,
        priceChange24hPercent: -10 + Math.random() * 20,
        logoURI: "https://via.placeholder.com/150",
        liquidity: 1e6 + Math.random() * 9000000,
        holders: Math.floor(500 + Math.random() * 9500),
        sourceProvider: "dummy",
        lastUpdatedAt: new Date,
        raw: {
          dummyData: true
        }
      });
    }
    return tokens;
  }
  async searchTokens(query, chain = "solana", limit = 5) {
    const upperQuery = query.toUpperCase();
    const tokens = [];
    for (let i = 0;i < limit; i++) {
      const symbol = upperQuery;
      tokens.push({
        id: `${chain}:0xsearch${i}`,
        symbol,
        name: `Dummy Token ${upperQuery}`,
        address: `0xsearch${i}`,
        chain,
        decimals: 18,
        totalSupply: "1000000000",
        price: 1.23 * (i + 1),
        priceUsd: 1.23 * (i + 1),
        marketCapUsd: 1230000000 * (i + 1),
        marketCapUSD: 1230000000 * (i + 1),
        volume24hUsd: 45600000 * (i + 1),
        volume24hUSD: 45600000 * (i + 1),
        priceChange24h: 5.67 * (i % 2 === 0 ? 1 : -1),
        priceChange24hPercent: 5.67 * (i % 2 === 0 ? 1 : -1),
        logoURI: "https://via.placeholder.com/150",
        liquidity: 1e6 + Math.random() * 9000000,
        holders: Math.floor(500 + Math.random() * 9500),
        sourceProvider: "dummy",
        lastUpdatedAt: new Date,
        raw: {
          dummyData: true
        }
      });
    }
    return tokens;
  }
  async getTokensByAddresses(addresses, chain = "solana") {
    return addresses.map((address, index) => {
      const symbol = address.length > 6 ? address.substring(2, 6).toUpperCase() : address.toUpperCase();
      return {
        id: `${chain}:${address}`,
        symbol,
        name: `Dummy Token ${symbol}`,
        address,
        chain,
        decimals: 18,
        totalSupply: "1000000000",
        price: 1.23 * (index + 1),
        priceUsd: 1.23 * (index + 1),
        marketCapUsd: 1230000000 * (index + 1),
        marketCapUSD: 1230000000 * (index + 1),
        volume24hUsd: 45600000 * (index + 1),
        volume24hUSD: 45600000 * (index + 1),
        priceChange24h: 5.67 * (index % 2 === 0 ? 1 : -1),
        priceChange24hPercent: 5.67 * (index % 2 === 0 ? 1 : -1),
        logoURI: "https://via.placeholder.com/150",
        liquidity: 1e6 + Math.random() * 9000000,
        holders: Math.floor(500 + Math.random() * 9500),
        sourceProvider: "dummy",
        lastUpdatedAt: new Date,
        raw: {
          dummyData: true
        }
      };
    });
  }
  getDexName() {
    return "dummy-token-data";
  }
}

// src/lp/service.ts
import { Service as Service2 } from "@elizaos/core";

class DummyLpService extends Service2 {
  static serviceType = "lp";
  capabilityDescription = "Dummy LP service for testing";
  constructor(runtime) {
    super(runtime);
  }
  getDexName() {
    return "dummy";
  }
  static async start(runtime) {
    const service = new DummyLpService(runtime);
    await service.start();
    return service;
  }
  async start() {
    console.log("[DummyLpService] started.");
  }
  async stop() {
    console.log("[DummyLpService] stopped.");
  }
  async getPoolInfo(poolAddress) {
    return {
      address: poolAddress,
      tokenA: "0xTokenA",
      tokenB: "0xTokenB",
      fee: 3000,
      liquidity: BigInt(1e6),
      sqrtPriceX96: BigInt(1e6),
      tick: 0
    };
  }
  async getPosition(positionId) {
    return {
      poolAddress: "0xPool",
      tokenA: "0xTokenA",
      tokenB: "0xTokenB",
      liquidity: BigInt(1000)
    };
  }
  async addLiquidity(params) {
    return {
      success: true,
      transactionId: `dummy-tx-${Date.now()}`,
      lpTokensReceived: {
        amount: "100000000",
        address: "dummy-lp-mint-dummy-pool-1",
        uiAmount: 100
      }
    };
  }
  async removeLiquidity(params) {
    return {
      success: true,
      transactionId: `dummy-tx-${Date.now()}`,
      tokensReceived: [
        { token: "tokenA", amount: "1000000000", symbol: "SOL" },
        { token: "tokenB", amount: "1000000", symbol: "USDC" }
      ]
    };
  }
  async collectFees(positionId) {
    return {
      hash: "0xDummyHash",
      success: true
    };
  }
  async getBalances(address) {
    return [
      {
        token: "0xTokenA",
        balance: BigInt(1000),
        decimals: 18
      },
      {
        token: "0xTokenB",
        balance: BigInt(2000),
        decimals: 18
      }
    ];
  }
  async getPools(tokenAMint) {
    const pools = [
      {
        id: "dummy-pool-1",
        tokenA: { mint: "So11111111111111111111111111111111111111112" },
        tokenB: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
        liquidity: "1000000",
        type: "concentrated"
      },
      {
        id: "dummy-stable-pool-2",
        tokenA: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
        tokenB: { mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
        liquidity: "5000000",
        type: "stable"
      }
    ];
    if (tokenAMint) {
      return pools.filter((pool) => pool.tokenA.mint === tokenAMint);
    }
    return pools;
  }
  async getLpPositionDetails(userPublicKey, positionId) {
    const parts = positionId.split("-");
    const poolStartIndex = parts.lastIndexOf("dummy");
    const poolId = parts.slice(poolStartIndex).join("-");
    const lpMint = parts.slice(0, poolStartIndex).join("-");
    return {
      dex: "dummy",
      poolId,
      userPublicKey,
      lpTokenBalance: {
        amount: 100,
        address: positionId
      },
      lpMint,
      positionValue: 1000,
      valueUsd: 1000,
      tokenAAmount: 500,
      tokenBAmount: 500,
      sharePercentage: 0.01,
      apr: 15.5,
      fees24h: 2.5,
      unclaimedFees: 5.75,
      underlyingTokens: [
        { symbol: "tokenA", amount: 500 },
        { symbol: "tokenB", amount: 500 }
      ],
      raw: {
        lpTokenDecimals: 9,
        tokenADecimals: 9,
        tokenBDecimals: 6
      }
    };
  }
  async getMarketDataForPools(poolIds) {
    const marketData = {};
    for (const poolId of poolIds) {
      marketData[poolId] = {
        poolId,
        price: 1 + Math.random() * 0.1,
        volume24h: 1e5 + Math.random() * 50000,
        tvl: 1e6 + Math.random() * 500000,
        apy: 10 + Math.random() * 20,
        priceChange24h: -5 + Math.random() * 10
      };
    }
    return marketData;
  }
  async swap(tokenIn, tokenOut, amountIn, minAmountOut, slippage) {
    return {
      hash: "0xDummyHash",
      success: true
    };
  }
}

// src/wallet/service.ts
import { Service as Service3 } from "@elizaos/core";

class DummyWalletService extends Service3 {
  static serviceType = "wallet";
  capabilityDescription = "Dummy wallet service for testing";
  balances = new Map;
  prices = new Map;
  decimals = new Map;
  quoteAsset = "USDC";
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    const service = new DummyWalletService(runtime);
    await service.start();
    return service;
  }
  async start() {
    this.balances.set("USDC", BigInt(1e4 * 1e6));
    this.prices.set("USDC", 1);
    this.decimals.set("USDC", 6);
    console.log("[DummyWalletService] started.");
  }
  async stop() {
    this.balances.clear();
    this.prices.clear();
    this.decimals.clear();
    console.log("[DummyWalletService] stopped.");
  }
  async getBalance(asset) {
    return this.balances.get(asset) || BigInt(0);
  }
  addFunds(asset, amount) {
    const currentBalance = this.balances.get(asset) || BigInt(0);
    this.balances.set(asset, currentBalance + BigInt(amount));
  }
  setPortfolioHolding(asset, amount, price = 1) {
    if (asset === this.quoteAsset) {
      this.addFunds(asset, amount);
      this.prices.set(asset, 1);
      this.decimals.set(asset, 6);
    } else {
      const decimals = 6;
      const scaledAmount = Math.floor(amount * Math.pow(10, decimals));
      this.balances.set(asset, BigInt(scaledAmount));
      this.prices.set(asset, price);
      this.decimals.set(asset, decimals);
    }
  }
  resetWallet(initialCash = 1e4, quoteAsset = "USDC") {
    this.balances.clear();
    this.prices.clear();
    this.decimals.clear();
    this.quoteAsset = quoteAsset;
    this.balances.set(quoteAsset, BigInt(initialCash * 1e6));
    this.prices.set(quoteAsset, 1);
    this.decimals.set(quoteAsset, 6);
  }
  async transferSol(from, to, amount) {
    const amountBigInt = BigInt(amount);
    const solBalance = this.balances.get("SOL") || BigInt(0);
    if (solBalance < amountBigInt) {
      throw new Error(`Insufficient SOL balance`);
    }
    this.balances.set("SOL", solBalance - amountBigInt);
    return `dummy-tx-${Date.now()}`;
  }
  getPortfolio() {
    const assets = [];
    let totalValueUsd = 0;
    for (const [asset, balance] of this.balances.entries()) {
      const price = this.prices.get(asset) || 1;
      const decimals = this.decimals.get(asset) || 6;
      const divisor = Math.pow(10, decimals);
      const quantity = Number(balance) / divisor;
      const valueUsd = quantity * price;
      totalValueUsd += valueUsd;
      assets.push({
        symbol: asset,
        address: `dummy-${asset.toLowerCase()}-address`,
        balance: Number(balance),
        valueUsd,
        value: valueUsd,
        amount: quantity,
        quantity,
        price,
        averagePrice: price,
        allocation: 0,
        decimals
      });
    }
    for (const asset of assets) {
      asset.allocation = totalValueUsd > 0 ? asset.valueUsd / totalValueUsd * 100 : 0;
    }
    return {
      totalValueUsd,
      assets,
      timestamp: Date.now()
    };
  }
  get serviceName() {
    return "dummy-wallet";
  }
}

// src/pdf/service.ts
import { Service as Service4, ServiceType, logger as logger3 } from "@elizaos/core";

class DummyPdfService extends Service4 {
  static serviceType = ServiceType.PDF;
  capabilityDescription = "Dummy PDF service for testing";
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    const service = new DummyPdfService(runtime);
    await service.initialize();
    return service;
  }
  async initialize() {
    logger3.info("DummyPdfService initialized");
  }
  async stop() {
    logger3.info("DummyPdfService stopped");
  }
  async extractText(pdfBuffer) {
    logger3.debug(`Extracting text from PDF (${pdfBuffer.length} bytes)`);
    return {
      text: "This is dummy extracted text from the PDF document.",
      metadata: {
        title: "Dummy PDF Document",
        author: "Dummy Author",
        pages: 10,
        creationDate: new Date
      }
    };
  }
  async generatePdf(content, options) {
    logger3.debug("Generating PDF", JSON.stringify(options));
    const dummyPdf = Buffer.from("dummy-pdf-content");
    logger3.debug(`Generated PDF: ${dummyPdf.length} bytes`);
    return dummyPdf;
  }
  async convertToPdf(input, inputFormat, options) {
    logger3.debug(`Converting ${inputFormat} to PDF`, JSON.stringify(options));
    const dummyPdf = Buffer.from(`dummy-pdf-from-${inputFormat}`);
    logger3.debug(`Converted to PDF: ${dummyPdf.length} bytes`);
    return dummyPdf;
  }
  async mergePdfs(pdfBuffers) {
    logger3.debug(`Merging ${pdfBuffers.length} PDFs`);
    const totalSize = pdfBuffers.reduce((sum, buf) => sum + buf.length, 0);
    const mergedPdf = Buffer.from(`dummy-merged-pdf-${totalSize}`);
    return mergedPdf;
  }
  async splitPdf(pdfBuffer, ranges) {
    logger3.debug(`Splitting PDF into ${ranges.length} parts`);
    return ranges.map((range, index) => Buffer.from(`dummy-split-pdf-part-${index}-pages-${range[0]}-${range[1]}`));
  }
  getDexName() {
    return "dummy-pdf";
  }
}

// src/video/service.ts
import { Service as Service5, ServiceType as ServiceType2, logger as logger4 } from "@elizaos/core";

class DummyVideoService extends Service5 {
  static serviceType = ServiceType2.VIDEO;
  capabilityDescription = "Dummy video service for testing";
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    const service = new DummyVideoService(runtime);
    await service.initialize();
    return service;
  }
  async initialize() {
    logger4.info("DummyVideoService initialized");
  }
  async stop() {
    logger4.info("DummyVideoService stopped");
  }
  async getVideoInfo(url) {
    logger4.debug(`Getting video info for: ${url}`);
    return {
      title: "Dummy Video Title",
      duration: 300,
      resolution: {
        width: 1920,
        height: 1080
      },
      format: "mp4",
      size: 50000000,
      fps: 30,
      codec: "h264"
    };
  }
  async downloadVideo(url, options) {
    logger4.debug(`Downloading video from: ${url}`, JSON.stringify(options));
    const dummyVideo = Buffer.from(`dummy-video-${options?.format || "mp4"}`);
    logger4.debug(`Downloaded video: ${dummyVideo.length} bytes`);
    return dummyVideo;
  }
  async extractAudio(videoBuffer) {
    logger4.debug(`Extracting audio from video (${videoBuffer.length} bytes)`);
    return Buffer.from("dummy-audio-from-video");
  }
  async extractFrames(videoBuffer, timestamps) {
    logger4.debug(`Extracting ${timestamps.length} frames from video`);
    return timestamps.map((ts, index) => Buffer.from(`dummy-frame-${index}-at-${ts}s`));
  }
  async processVideo(videoBuffer, options) {
    logger4.debug("Processing video", JSON.stringify(options));
    const processedVideo = Buffer.from(`dummy-processed-video-${options.outputFormat || "mp4"}`);
    logger4.debug(`Processed video: ${processedVideo.length} bytes`);
    return processedVideo;
  }
  async getAvailableFormats(url) {
    logger4.debug(`Getting available formats for: ${url}`);
    return [
      {
        format: "mp4",
        resolution: "1920x1080",
        size: 50000000,
        url: `${url}?format=1080p`
      },
      {
        format: "mp4",
        resolution: "1280x720",
        size: 25000000,
        url: `${url}?format=720p`
      },
      {
        format: "mp4",
        resolution: "640x480",
        size: 1e7,
        url: `${url}?format=480p`
      }
    ];
  }
  getDexName() {
    return "dummy-video";
  }
}

// src/browser/service.ts
import { Service as Service6, ServiceType as ServiceType3, logger as logger5 } from "@elizaos/core";

class DummyBrowserService extends Service6 {
  static serviceType = ServiceType3.BROWSER;
  capabilityDescription = "Dummy browser service for testing";
  currentUrl = "about:blank";
  history = [];
  historyIndex = -1;
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    const service = new DummyBrowserService(runtime);
    await service.initialize();
    return service;
  }
  async initialize() {
    logger5.info("DummyBrowserService initialized");
  }
  async stop() {
    logger5.info("DummyBrowserService stopped");
  }
  async navigate(url, options) {
    logger5.debug(`Navigating to ${url}`);
    if (options) {
      logger5.debug("Navigation options:", JSON.stringify(options));
    }
    this.history.push(url);
    this.historyIndex = this.history.length - 1;
    this.currentUrl = url;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  async screenshot(options) {
    logger5.debug("Taking screenshot", JSON.stringify(options));
    const dummyImage = Buffer.from("dummy-screenshot-data");
    logger5.debug(`Screenshot taken: ${dummyImage.length} bytes`);
    return dummyImage;
  }
  async extractContent(selectors) {
    logger5.debug("Extracting content", JSON.stringify(selectors));
    const dummyContent = [
      {
        text: "Dummy extracted text",
        html: "<div>Dummy HTML content</div>",
        attributes: {
          class: "dummy-class",
          id: "dummy-id"
        }
      }
    ];
    if (selectors && selectors.length > 0) {
      return selectors.map((selector) => ({
        text: `Dummy text for ${selector.selector}`,
        html: `<div>${selector.selector}</div>`,
        attributes: { selector: selector.selector }
      }));
    }
    return dummyContent;
  }
  async waitForSelector(selector, timeout) {
    logger5.debug(`Waiting for selector: ${selector.selector}`);
    const waitTime = Math.min(timeout || 1000, 100);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    logger5.debug(`Selector found: ${selector.selector}`);
    return true;
  }
  async click(selector, options) {
    logger5.debug(`Clicking on: ${selector.selector}`, JSON.stringify(options));
    const delay = options?.delay || 50;
    await new Promise((resolve) => setTimeout(resolve, delay));
    logger5.debug(`Clicked on: ${selector.selector}`);
  }
  async type(selector, text, options) {
    logger5.debug(`Typing into: ${selector.selector}`, JSON.stringify(options));
    const delay = options?.delay || 50;
    await new Promise((resolve) => setTimeout(resolve, text.length * delay));
    logger5.debug(`Typed "${text}" into: ${selector.selector}`);
  }
  async evaluateScript(script) {
    logger5.debug("Evaluating script:", script.substring(0, 100) + "...");
    return { success: true, data: "dummy-script-result" };
  }
  async goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.currentUrl = this.history[this.historyIndex];
      logger5.debug(`Navigated back to: ${this.currentUrl}`);
    }
  }
  async goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.currentUrl = this.history[this.historyIndex];
      logger5.debug(`Navigated forward to: ${this.currentUrl}`);
    }
  }
  async refresh() {
    logger5.debug(`Refreshing page: ${this.currentUrl}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  async getUrl() {
    logger5.debug(`Current URL: ${this.currentUrl}`);
    return this.currentUrl;
  }
  async getTitle() {
    logger5.debug("Getting page title");
    return `Dummy Title - ${this.currentUrl}`;
  }
  async setCookies(cookies) {
    logger5.debug(`Setting ${cookies.length} cookies`);
  }
  async getCookies() {
    logger5.debug("Getting cookies");
    return [];
  }
  async clearCookies() {
    logger5.debug("Clearing cookies");
  }
  getDexName() {
    return "dummy-browser";
  }
}

// src/transcription/service.ts
import { Service as Service7, ServiceType as ServiceType4, logger as logger6 } from "@elizaos/core";

class DummyTranscriptionService extends Service7 {
  static serviceType = ServiceType4.TRANSCRIPTION;
  capabilityDescription = "Dummy transcription service for testing";
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    const service = new DummyTranscriptionService(runtime);
    await service.initialize();
    return service;
  }
  async initialize() {
    logger6.info("DummyTranscriptionService initialized");
  }
  async stop() {
    logger6.info("DummyTranscriptionService stopped");
  }
  async transcribeAudio(audioBuffer, options) {
    logger6.debug(`Transcribing audio (${audioBuffer.length} bytes)`, JSON.stringify(options));
    const segments = [
      {
        id: 0,
        start: 0,
        end: 5,
        text: "This is the first segment of dummy transcription.",
        confidence: 0.95
      },
      {
        id: 1,
        start: 5,
        end: 10,
        text: "This is the second segment with more text.",
        confidence: 0.92
      },
      {
        id: 2,
        start: 10,
        end: 15,
        text: "And this is the final segment of the transcription.",
        confidence: 0.94
      }
    ];
    const words = [
      { word: "This", start: 0, end: 0.5, confidence: 0.96 },
      { word: "is", start: 0.5, end: 0.8, confidence: 0.98 },
      { word: "the", start: 0.8, end: 1, confidence: 0.99 },
      { word: "first", start: 1, end: 1.5, confidence: 0.94 },
      { word: "segment", start: 1.5, end: 2, confidence: 0.93 }
    ];
    const result = {
      text: segments.map((s) => s.text).join(" "),
      language: options?.language || "en",
      duration: 15,
      segments: options?.timestamps ? segments : undefined,
      words: options?.timestamps ? words : undefined
    };
    logger6.debug(`Transcription complete: ${result.text.substring(0, 50)}...`);
    return result;
  }
  async transcribeVideo(videoBuffer, options) {
    logger6.debug(`Transcribing video (${videoBuffer.length} bytes)`, JSON.stringify(options));
    return this.transcribeAudio(videoBuffer, options);
  }
  async speechToText(audioBuffer, options) {
    logger6.debug("Converting speech to text", JSON.stringify(options));
    const result = await this.transcribeAudio(audioBuffer, options);
    logger6.debug(`Speech to text complete: ${result.text.substring(0, 50)}...`);
    if (options?.format === "text" || !options?.format) {
      return result.text;
    }
    return result;
  }
  async textToSpeech(text, options) {
    logger6.debug(`Converting text to speech: "${text.substring(0, 50)}..."`, JSON.stringify(options));
    const format = options?.format || "mp3";
    const dummyAudio = Buffer.from(`dummy-audio-${format}-${text.length}-chars`);
    logger6.debug(`Generated ${format} audio: ${dummyAudio.length} bytes`);
    return dummyAudio;
  }
  async detectLanguage(audioBuffer) {
    logger6.debug(`Detecting language from audio (${audioBuffer.length} bytes)`);
    return "en";
  }
  async translateAudio(audioBuffer, targetLanguage, sourceLanguage) {
    logger6.debug(`Translating audio to ${targetLanguage}`, JSON.stringify({ sourceLanguage }));
    return {
      text: `This is dummy translated text in ${targetLanguage}.`,
      language: targetLanguage,
      duration: 10
    };
  }
  getDexName() {
    return "dummy-transcription";
  }
}

// src/web-search/service.ts
import { Service as Service8, ServiceType as ServiceType5, logger as logger7 } from "@elizaos/core";

class DummyWebSearchService extends Service8 {
  static serviceType = ServiceType5.WEB_SEARCH;
  capabilityDescription = "Dummy web search service for testing";
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    const service = new DummyWebSearchService(runtime);
    await service.initialize();
    return service;
  }
  async initialize() {
    logger7.info("DummyWebSearchService initialized");
  }
  async stop() {
    logger7.info("DummyWebSearchService stopped");
  }
  async search(options) {
    logger7.debug("Performing web search", JSON.stringify(options));
    const limit = options.limit || 10;
    const results = [];
    logger7.debug(`Generating ${limit} dummy search results for: ${options.query}`);
    for (let i = 0;i < limit; i++) {
      results.push({
        title: `Result ${i + 1}: ${options.query}`,
        url: `https://example.com/result-${i}`,
        description: `This is dummy search result ${i + 1} for query: ${options.query}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        displayUrl: `example.com/result-${i}`,
        source: "DummySearch",
        relevanceScore: 0.9 - i * 0.05,
        snippet: `Dummy snippet for search result ${i + 1}`
      });
    }
    return {
      results,
      totalResults: 1000,
      nextOffset: (options.offset || 0) + limit
    };
  }
  async searchNews(options) {
    logger7.debug("Performing news search", JSON.stringify(options));
    const limit = options.limit || 10;
    const results = [];
    logger7.debug(`Generating ${limit} dummy news results for: ${options.query}`);
    for (let i = 0;i < limit; i++) {
      results.push({
        title: `News: ${options.query} - Article ${i + 1}`,
        url: `https://news.example.com/article-${i}`,
        description: `Breaking News ${i + 1}: ${options.query}. This is a dummy news article content that discusses the latest developments.`,
        displayUrl: `news.example.com/article-${i}`,
        source: "DummyNews",
        publishedDate: new Date(Date.now() - i * 86400000),
        relevanceScore: 0.95 - i * 0.05,
        snippet: `Latest news about ${options.query}`
      });
    }
    return {
      results,
      totalResults: 500,
      nextOffset: (options.offset || 0) + limit
    };
  }
  async searchImages(options) {
    logger7.debug("Performing image search", JSON.stringify(options));
    const limit = options.limit || 10;
    const results = [];
    logger7.debug(`Generating ${limit} dummy image results for: ${options.query}`);
    for (let i = 0;i < limit; i++) {
      results.push({
        title: `Image: ${options.query} - ${i + 1}`,
        url: `https://images.example.com/img-${i}.jpg`,
        description: `A ${options.size || "medium"} image related to ${options.query}`,
        displayUrl: `images.example.com/img-${i}.jpg`,
        source: "DummyImages",
        thumbnail: `https://images.example.com/thumb-${i}.jpg`,
        relevanceScore: 0.85 - i * 0.05,
        snippet: `Image ${i + 1} related to: ${options.query}`
      });
    }
    return {
      results,
      totalResults: 1e4,
      nextOffset: (options.offset || 0) + limit
    };
  }
  async searchVideos(options) {
    logger7.debug("Performing video search", JSON.stringify(options));
    const limit = options.limit || 10;
    const results = [];
    logger7.debug(`Generating ${limit} dummy video results for: ${options.query}`);
    for (let i = 0;i < limit; i++) {
      results.push({
        title: `Video: ${options.query} - Part ${i + 1}`,
        url: `https://videos.example.com/video-${i}`,
        description: `A ${options.duration || "medium"} length video about ${options.query}. This video demonstrates various aspects of the search query.`,
        displayUrl: `videos.example.com/video-${i}`,
        source: "DummyVideos",
        thumbnail: `https://videos.example.com/thumb-${i}.jpg`,
        publishedDate: new Date(Date.now() - i * 86400000),
        relevanceScore: 0.88 - i * 0.05,
        snippet: `Video ${i + 1}: ${options.query}`
      });
    }
    return {
      results,
      totalResults: 5000,
      nextOffset: (options.offset || 0) + limit
    };
  }
  async autocomplete(query) {
    logger7.debug(`Getting autocomplete suggestions for: ${query}`);
    return [
      `${query} tutorial`,
      `${query} examples`,
      `${query} documentation`,
      `${query} best practices`,
      `${query} guide`,
      `${query} tips`,
      `${query} tricks`,
      `${query} how to`
    ];
  }
  async getTrendingSearches(region) {
    logger7.debug(`Getting trending searches for region: ${region || "global"}`);
    return [
      "artificial intelligence",
      "machine learning",
      "blockchain technology",
      "climate change",
      "renewable energy",
      "space exploration",
      "quantum computing",
      "cybersecurity"
    ];
  }
  async getRelatedSearches(query) {
    logger7.debug(`Getting related searches for: ${query}`);
    return [
      `${query} alternatives`,
      `${query} vs competitors`,
      `${query} pricing`,
      `${query} reviews`,
      `best ${query}`,
      `${query} comparison`,
      `${query} features`,
      `${query} benefits`
    ];
  }
  getDexName() {
    return "dummy-web-search";
  }
}

// src/email/service.ts
import { Service as Service9, ServiceType as ServiceType6, logger as logger8 } from "@elizaos/core";

class DummyEmailService extends Service9 {
  static serviceType = ServiceType6.EMAIL;
  capabilityDescription = "Dummy email service for testing";
  emails = [];
  folders = [
    { name: "Inbox", path: "INBOX", messageCount: 0, unreadCount: 0 },
    { name: "Sent", path: "SENT", messageCount: 0, unreadCount: 0 }
  ];
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    const service = new DummyEmailService(runtime);
    await service.initialize();
    return service;
  }
  async initialize() {
    logger8.info("DummyEmailService initialized");
  }
  async stop() {
    logger8.info("DummyEmailService stopped");
  }
  async sendEmail(to, subject, body, options) {
    logger8.debug("Sending email", JSON.stringify({ to, subject }));
    logger8.debug("Email options:", JSON.stringify(options));
    const messageId = `dummy-${Date.now()}@example.com`;
    logger8.info(`Email sent successfully. Message ID: ${messageId}`);
    const sentEmail = {
      id: messageId,
      from: { address: "dummy@example.com", name: "Dummy Sender" },
      to,
      cc: options?.cc,
      bcc: options?.bcc,
      subject,
      body,
      html: options?.html,
      attachments: options?.attachments,
      date: new Date,
      messageId
    };
    this.emails.push(sentEmail);
    return messageId;
  }
  async searchEmails(options) {
    logger8.debug("Searching emails", JSON.stringify(options));
    let results = this.emails;
    if (options) {
      if (options.from) {
        results = results.filter((e) => e.from.address.includes(options.from));
      }
      if (options.subject) {
        results = results.filter((e) => e.subject.toLowerCase().includes(options.subject.toLowerCase()));
      }
      if (options.limit) {
        results = results.slice(0, options.limit);
      }
    }
    logger8.debug(`Found ${results.length} emails`);
    return results;
  }
  async getEmail(messageId) {
    logger8.debug(`Getting email: ${messageId}`);
    const email = this.emails.find((e) => e.id === messageId);
    return email || null;
  }
  async deleteEmail(messageId) {
    logger8.debug(`Deleting email: ${messageId}`);
    const index = this.emails.findIndex((e) => e.id === messageId);
    if (index !== -1) {
      this.emails.splice(index, 1);
      return true;
    }
    return false;
  }
  async markAsRead(messageId) {
    logger8.debug(`Marking email as read: ${messageId}`);
    return true;
  }
  async markAsUnread(messageId) {
    logger8.debug(`Marking email as unread: ${messageId}`);
    return true;
  }
  async moveToFolder(messageId, folderPath) {
    logger8.debug(`Moving email ${messageId} to folder: ${folderPath}`);
    return true;
  }
  async getFolders() {
    logger8.debug("Getting email folders");
    return this.folders;
  }
  async createFolder(name, parentPath) {
    logger8.debug(`Creating folder: ${name}`, JSON.stringify({ parentPath }));
    const path = parentPath ? `${parentPath}/${name}` : name;
    const folder = {
      name,
      path,
      messageCount: 0,
      unreadCount: 0
    };
    this.folders.push(folder);
    return folder;
  }
  async deleteFolder(folderPath) {
    logger8.debug(`Deleting folder: ${folderPath}`);
    const index = this.folders.findIndex((f) => f.path === folderPath);
    if (index !== -1) {
      this.folders.splice(index, 1);
      return true;
    }
    return false;
  }
  async replyToEmail(messageId, body, options) {
    logger8.debug(`Replying to email: ${messageId}`, JSON.stringify(options));
    const replyMessageId = `dummy-reply-${Date.now()}@example.com`;
    logger8.info(`Reply sent successfully. Message ID: ${replyMessageId}`);
    return replyMessageId;
  }
  async forwardEmail(messageId, to, options) {
    logger8.debug(`Forwarding email: ${messageId}`, JSON.stringify({ to, options }));
    const forwardMessageId = `dummy-forward-${Date.now()}@example.com`;
    logger8.info(`Email forwarded successfully. Message ID: ${forwardMessageId}`);
    return forwardMessageId;
  }
  getDexName() {
    return "dummy-email";
  }
}

// src/e2e/scenarios.ts
import { logger as logger9 } from "@elizaos/core";
var dummyServicesScenariosSuite = {
  name: "Dummy Services E2E Tests",
  tests: [
    {
      name: "Dummy test placeholder",
      async fn(runtime) {
        logger9.info("Dummy services test placeholder");
      }
    }
  ]
};

// src/index.ts
var dummyServicesPlugin = {
  name: "dummy-services",
  description: "Load standard dummy services for testing purposes.",
  services: [
    DummyTokenDataService,
    DummyLpService,
    DummyWalletService,
    DummyPdfService,
    DummyVideoService,
    DummyBrowserService,
    DummyTranscriptionService,
    DummyWebSearchService,
    DummyEmailService
  ],
  tests: [dummyServicesScenariosSuite],
  init: async (runtime) => {
    console.log("Dummy Services Plugin Initialized");
  }
};
var src_default = dummyServicesPlugin;
export {
  dummyServicesPlugin,
  src_default as default,
  DummyWebSearchService,
  DummyWalletService,
  DummyVideoService,
  DummyTranscriptionService,
  DummyTokenDataService,
  DummyPdfService,
  DummyLpService,
  DummyEmailService,
  DummyBrowserService
};

//# debugId=6F637A989CA848D464756E2164756E21
//# sourceMappingURL=index.js.map
