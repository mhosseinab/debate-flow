import type { Evaluator } from "../types";
import { faithfulness } from "./faithfulness";
import { formatCompliance } from "./formatCompliance";
import { configAdherence } from "./configAdherence";
import { safety } from "./safety";

export { faithfulness, formatCompliance, configAdherence, safety };

/** The four quality dimensions, scored together. */
export const ALL_EVALUATORS: Evaluator[] = [faithfulness, formatCompliance, configAdherence, safety];
