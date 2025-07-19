import { nextHandler } from '@genkit-ai/next';

export const dynamic = 'force-dynamic';

const handler = nextHandler();

export {
    handler as GET,
    handler as POST
};
