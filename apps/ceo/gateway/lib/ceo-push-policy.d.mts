export declare const pushKinds:readonly string[];
export declare function validRef(kind:string,ref:string):boolean;
export declare function pushRoute(kind:string,ref:string):string;
export declare function pushEndpoint(endpoint:unknown):boolean;
export declare function parseSubscription(body:unknown):{endpoint:string;p256dh:string;auth:string}|null;
export declare function pendingTargets(subscriptions:Array<{endpoint:string;created_at:Date}>,sentEndpoints:string[],occurredAt:Date):Array<{endpoint:string;created_at:Date}>;
export declare function pushPayload(kind:string,ref:string,badge:number):string;
export declare function allowedOrigin(request:Request):boolean;
