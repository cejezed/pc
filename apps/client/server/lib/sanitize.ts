export function sanitizeForLLM(text: string): string {
    if (!text) return text;

    let sanitized = text
        // Remove names (capitalize + lowercase patterns)
        .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, 'someone')
        .replace(/\b[A-Z][a-z]+\b/g, (match) => {
            // Keep common words, sanitize names
            const common = [
                'I',
                'You',
                'The',
                'A',
                'And',
                'But',
                'For',
                'With',
                'From',
                'To',
                'In',
                'On',
                'At',
            ];
            return common.includes(match) ? match : 'someone';
        })
        // Remove dates
        .replace(/\d{4}-\d{2}-\d{2}/g, 'a specific date')
        .replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, 'a date')
        .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/g, 'a month')
        // Remove years
        .replace(/\b(19|20)\d{2}\b/g, 'a year')
        // Remove phone-like patterns
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, 'a phone')
        // Remove emails
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'an email')
        // Remove addresses (basic)
        .replace(/\b\d+\s+[A-Z][a-z]+\s+(St|Ave|Rd|Blvd|Road|Street|Avenue)\b/g, 'an address');

    return sanitized;
}
