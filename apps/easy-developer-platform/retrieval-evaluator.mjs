export function evaluateRetrieval({ relevant = [], retrieved = [], budget = Infinity } = {}) {
  const relevantSet = new Set(relevant);
  const bounded = retrieved.slice(0, budget);
  const retrievedSet = new Set(bounded);
  const truePositives = [...retrievedSet].filter(x => relevantSet.has(x)).length;
  const falsePositives = [...retrievedSet].filter(x => !relevantSet.has(x)).length;
  const falseNegatives = [...relevantSet].filter(x => !retrievedSet.has(x)).length;
  const precision = retrievedSet.size ? truePositives / retrievedSet.size : 0;
  const recall = relevantSet.size ? truePositives / relevantSet.size : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { truePositives, falsePositives, falseNegatives, precision, recall, f1, budget, withinBudget: bounded.length <= budget };
}

export function shouldAbstain({ recall = 0, precision = 0, minimumRecall = 0.8, minimumPrecision = 0.5 } = {}) {
  return recall < minimumRecall || precision < minimumPrecision;
}
