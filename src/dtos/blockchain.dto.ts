import { z } from 'zod';

export const UploadToIPFSDto = z.object({
    files: z.array(
        z.object({
            originalname: z.string(),
            buffer: z.instanceof(Buffer),
        }),
    ),
});
