import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

const validateDTO =
    (schema: ZodSchema) =>
    async (req: Request, _: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
                cookies: req.cookies,
            });
            return next();
        } catch (error) {
            next(error);
        }
    };

export default validateDTO;
