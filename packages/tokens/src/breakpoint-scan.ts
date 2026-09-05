export function findWidthQueryViolations(
  css: string,
  allowedWidths: ReadonlySet<string>,
): string[] {
  const queryPattern = /\((min|max)-width:\s*([^)\s]+)\)/g;
  const violations: string[] = [];

  for (const match of css.matchAll(queryPattern)) {
    const [, boundType, width] = match;
    // Width is optional in destructuring, but we know it exists from the regex
    const widthValue = width ?? '';

    // Reject max-width queries
    if (boundType === 'max') {
      violations.push(`found max-width: ${widthValue}; use min-width only`);
    }

    // Reject out-of-scale widths
    if (!allowedWidths.has(widthValue)) {
      violations.push(
        `found ${boundType}-width: ${widthValue}; allowed: ${[...allowedWidths].join(', ')}`,
      );
    }
  }

  return violations;
}
