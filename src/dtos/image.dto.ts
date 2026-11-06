import { z } from 'zod';
import isValidCID from '../utilities/isValidCID.utility';
import { isAddress } from 'web3-validator';

const uploadImageSchema = z.object({
    cid: z.string().min(1, 'CID is required').refine(isValidCID, {
        message: 'Invalid CID format',
    }),
    uploader: z
        .string()
        .min(1, 'uploader address is required')
        .refine(isAddress, {
            message:
                'Invalid Ethereum address (must be valid hex with checksum)',
        }),
});
