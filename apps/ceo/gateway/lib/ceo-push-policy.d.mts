export declare const pushKinds:readonly string[];
export declare function validRef(kind:string,ref:string):boolean;
export declare function pushRoute(kind:string,ref:string):string;
export declare function pushEndpoint(endpoint:unknown):boolean;
export declare function parseSubscription(body:unknown):{endpoint:string;p256dh:string;auth:string}|null;
export declare function pendingTargets<T extends {endpoint:string;created_at:Date}>(subscriptions:T[],sentEndpoints:string[],occurredAt:Date):T[];
export declare function pushPayload(kind:string,ref:string,badge:number):string;
export declare function allowedOrigin(request:Request):boolean;
