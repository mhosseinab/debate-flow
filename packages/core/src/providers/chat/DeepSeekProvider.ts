import { OpenAIProvider } from "./OpenAIProvider";

/** DeepSeek speaks the OpenAI chat API, so it rides ChatOpenAI pointed at its
 * own endpoint by default — no separate SDK. `cfg.baseURL` still overrides. */
export class DeepSeekProvider extends OpenAIProvider {
  override readonly id = "deepseek" as const;
  protected override readonly defaultBaseURL = "https://api.deepseek.com/v1";
}
