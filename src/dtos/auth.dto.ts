import { z } from 'zod';
import isValidCID from '../utilities/isValidCID.utility';

const insertImageSchema = z.object({
    cid: z.string().min(1, 'CID is required').refine(isValidCID, {
        message: 'Invalid CID format',
    }),
    department: z.enum(['CSE', 'EEE', 'ME']),
});
