import { Response } from 'express';

export interface DsbResponse extends Response {
    scopes?: string[];
}
