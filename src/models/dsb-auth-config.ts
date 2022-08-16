import { CdrConfig } from "./cdr-config";

export  interface  DsbAuthConfig extends CdrConfig {
    scopeFormat: 'LIST'| 'STRING';
}