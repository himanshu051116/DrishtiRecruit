import { RequirementCategory, VerificationMethod } from "@/domain/enums";

type QuestionBlueprint = {
  key: string;
  requirementNames: string[];
  category: RequirementCategory;
  method: VerificationMethod;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  prompt: string;
  maxScore: number;
  rubric: { type: "single_choice"; choices: string[]; correctIndex: number } | { type: "keyword"; keywords: string[]; minimumHits: number };
};

export const QUESTION_BANK: QuestionBlueprint[] = [
  { key: "node-event-loop", requirementNames: ["Node.js"], category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.MCQ, difficulty: "MEDIUM", prompt: "Which statement best describes how Node.js handles many concurrent I/O operations?", maxScore: 10, rubric: { type: "single_choice", choices: ["It creates one OS process for every request", "It uses an event loop with non-blocking I/O", "It executes all I/O synchronously on the main thread", "It requires a browser runtime"], correctIndex: 1 } },
  { key: "postgres-index", requirementNames: ["PostgreSQL"], category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.MCQ, difficulty: "MEDIUM", prompt: "A query frequently filters a large table by user_id. Which change most directly improves lookup performance when selectivity is useful?", maxScore: 10, rubric: { type: "single_choice", choices: ["Add a suitable index on user_id", "Convert every column to text", "Remove the WHERE clause", "Disable transactions"], correctIndex: 0 } },
  { key: "rest-idempotency", requirementNames: ["REST API Design"], category: RequirementCategory.COMPETENCY, method: VerificationMethod.PRACTICAL, difficulty: "MEDIUM", prompt: "In a few sentences, explain how you would make a payment-creation API safe against duplicate client retries.", maxScore: 10, rubric: { type: "keyword", keywords: ["idempotency", "key", "duplicate", "retry", "transaction"], minimumHits: 2 } },
  { key: "docker-practical", requirementNames: ["Docker"], category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.PRACTICAL, difficulty: "MEDIUM", prompt: "Describe how you would containerize a Node.js service while keeping dependencies reproducible and avoiding unnecessary files in the image.", maxScore: 10, rubric: { type: "keyword", keywords: ["dockerfile", "package-lock", "npm ci", ".dockerignore", "multi-stage", "non-root"], minimumHits: 2 } },
  { key: "security-api", requirementNames: ["Security Design"], category: RequirementCategory.COMPETENCY, method: VerificationMethod.PRACTICAL, difficulty: "MEDIUM", prompt: "Name and explain at least three controls you would use to protect a multi-user REST API from unauthorized access and abusive requests.", maxScore: 10, rubric: { type: "keyword", keywords: ["authorization", "authentication", "rate limit", "validation", "rbac", "csrf", "xss", "audit"], minimumHits: 3 } },
  { key: "aws-basics", requirementNames: ["AWS"], category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.MCQ, difficulty: "EASY", prompt: "Which AWS service is primarily an object storage service?", maxScore: 10, rubric: { type: "single_choice", choices: ["S3", "EC2", "Lambda", "RDS"], correctIndex: 0 } },
  { key: "postgres-sql-aggregate", requirementNames: ["PostgreSQL"], category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.SQL, difficulty: "MEDIUM", prompt: "Write a PostgreSQL query that returns each customer_id and total paid order value for completed orders, including only customers whose total exceeds 1000. Assume orders(customer_id, total_amount, status).", maxScore: 10, rubric: { type: "keyword", keywords: ["select", "customer_id", "sum", "group by", "having", "completed"], minimumHits: 5 } },
  { key: "node-debug-blocking", requirementNames: ["Node.js"], category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.DEBUGGING, difficulty: "MEDIUM", prompt: "A Node.js API performs CPU-heavy synchronous work inside every request handler and becomes unresponsive under concurrency. Explain the root cause and propose a concrete fix.", maxScore: 10, rubric: { type: "keyword", keywords: ["event loop", "blocking", "worker", "queue", "async", "offload"], minimumHits: 3 } },
  { key: "rest-coding-idempotency", requirementNames: ["REST API Design"], category: RequirementCategory.COMPETENCY, method: VerificationMethod.CODING, difficulty: "ADVANCED", prompt: "Sketch pseudocode for an idempotent POST /payments endpoint using an Idempotency-Key. Show where duplicate detection and response reuse occur.", maxScore: 10, rubric: { type: "keyword", keywords: ["idempotency", "key", "lookup", "duplicate", "stored", "response", "transaction"], minimumHits: 4 } },

];

export function chooseQuestion(requirementName: string, category: RequirementCategory, preferredMethod?: VerificationMethod) {
  const exact = QUESTION_BANK.find((q) => q.requirementNames.some((name) => name.toLowerCase() === requirementName.toLowerCase()) && (!preferredMethod || q.method === preferredMethod));
  if (exact) return exact;
  const categoryMatch = QUESTION_BANK.find((q) => q.category === category && (!preferredMethod || q.method === preferredMethod));
  return categoryMatch ?? QUESTION_BANK.find((q) => q.category === category) ?? null;
}
