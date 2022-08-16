
import { Request } from 'express';

export interface DsbRequest extends Request {
    scopes?: string[];
}
