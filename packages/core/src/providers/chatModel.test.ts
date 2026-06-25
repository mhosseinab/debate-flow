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

  it("throws a helpful error for an unknown provider", async () => {
    await expect(
      createChatModel({ provider: "nope" as never, model: "x", apiKey: "k" }),
    ).rejects.toThrow(/Unsupported chat provider/);
  });

  it("lists the registered providers", () => {
    expect(listChatProviders()).toEqual(expect.arrayContaining(["google-genai", "openai"]));
  });
});
