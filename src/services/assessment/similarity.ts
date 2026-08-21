export function normalizedTokens(input: string) {
  return input.toLowerCase().replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ").match(/[a-z0-9_]+|===|!==|==|!=|=>|<=|>=|&&|\|\||[+*%/-]/g) ?? [];
}

function shingles(tokens: string[], size = 5) {
  const result = new Set<string>();
  for (let i = 0; i <= tokens.length - size; i += 1) result.add(tokens.slice(i, i + size).join(" "));
  return result;
}

export function textSimilarity(a: string, b: string) {
  const aTokens = normalizedTokens(a); const bTokens = normalizedTokens(b);
  if (aTokens.length < 20 || bTokens.length < 20) return { similarity: 0, comparable: false, shared: 0 };
  const aSet = shingles(aTokens); const bSet = shingles(bTokens);
  if (!aSet.size || !bSet.size) return { similarity: 0, comparable: false, shared: 0 };
  let shared = 0; for (const value of aSet) if (bSet.has(value)) shared += 1;
  const union = aSet.size + bSet.size - shared;
  return { similarity: union ? shared / union : 0, comparable: true, shared };
}
