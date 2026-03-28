export const PRIORITY_CONFIG: Record<number, { label: string; color: string; description: string }> = {
  1: { label: 'Very Low', color: 'gray', description: 'Nice to have, low urgency' },
  2: { label: 'Low', color: 'teal', description: 'Useful, but not time-sensitive' },
  3: { label: 'Medium', color: 'yellow', description: 'Meaningful improvement for users' },
  4: { label: 'High', color: 'orange', description: 'Important problem worth prioritizing' },
  5: { label: 'Critical', color: 'red', description: 'High-value issue with strong impact' },
}
