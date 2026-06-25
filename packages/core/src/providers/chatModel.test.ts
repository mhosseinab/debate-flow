import { describe, it, expect } from "vitest";
import { createChatModel, listChatProviders } from "./chatModel";

describe("createChatModel (chat seam)", () => {
  it("builds a Gemini chat model with the requested model id", async () => {
    const model = await createChatModel({
      provider: "google-genai",
      model: "gemini-2.5-flash",
      apiKey: "test-key",
      temperature: 0.8,
    });
    expect(model).toBeDefined();
    expect(model.constructor.name).toBe("ChatGoogleGenerativeAI");
    expect((model as unknown as { model: string }).model).toBe("gemini-2.5-flash");
  });

  it("builds an OpenAI chat model through the same seam (provider-agnostic swap)", async () => {
    const model = await createChatModel({
      provider: "openai",
      model: "gpt-4o-mini",
      apiKey: "test-key",
    });
    expect(model.constructor.name).toBe("ChatOpenAI");
  });

  it("routes the openai provider to a custom endpoint URL when baseURL is set", async () => {
    const model = await createChatModel({
      provider: "openai",
      model: "gpt-4o-mini",
      apiKey: "test-key",
      baseURL: "https://proxy.example.com/v1",
    });
    expect(model.constructor.name).toBe("ChatOpenAI");
    expect((model as unknown as { clientConfig: { baseURL?: string } }).clientConfig.baseURL).toBe(
      "https://proxy.example.com/v1",
    );
  });

  it("builds a DeepSeek chat model (OpenAI-compatible) pointed at the DeepSeek endpoint by default", async () => {
    const model = await createChatModel({
      provider: "deepseek",
      model: "deepseek-chat",
      apiKey: "test-key",
    });
    expect(model.constructor.name).toBe("ChatOpenAI");
    expect((model as unknown as { model: string }).model).toBe("deepseek-chat");
    expect((model as unknown as { clientConfig: { baseURL?: string } }).clientConfig.baseURL).toBe(
      "https://api.deepseek.com/v1",
    );
  });

  it("lets baseURL override the DeepSeek default endpoint", async () => {
    const model = await createChatModel({
      provider: "deepseek",
      model: "deepseek-chat",
      apiKey: "test-key",
      baseURL: "https://self-hosted.example.com/v1",
    });
    expect((model as unknown as { clientConfig: { baseURL?: string } }).clientConfig.baseURL).toBe(
      "https://self-hosted.example.com/v1",
    );
  });

  it("throws a helpful error for an unknown provider", async () => {
    await expect(
      createChatModel({ provider: "nope" as never, model: "x", apiKey: "k" }),
    ).rejects.toThrow(/Unsupported chat provider/);
  });

  it("lists the registered providers", () => {
    expect(listChatProviders()).toEqual(
      expect.arrayContaining(["google-genai", "openai", "deepseek"]),
    );
  });
});
