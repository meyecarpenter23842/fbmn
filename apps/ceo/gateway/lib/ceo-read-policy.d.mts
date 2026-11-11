export type ReadKind="contact"|"outsourcing";
export declare function parseReadMark(value:unknown):{kind:ReadKind;id:string}|null;
export declare function readRequestIds(value:unknown):string[]|null;
export declare function attachReadReceipts(value:unknown,rows:Array<{id:string;viewed_at:string|Date}>):unknown;
