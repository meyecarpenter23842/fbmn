export declare function safeDraftId(id:unknown):boolean;
export declare function safeCampaignId(id:unknown):boolean;
export declare function approvalHash(payload:unknown):string;
export declare function approvalTicket(config:{status:string;key:Buffer},owner:string,payload:unknown,now?:number):string;
export declare function verifyApprovalTicket(config:{status:string;key:Buffer},owner:string,ticket:string,now?:number):Record<string,unknown>|null;
export declare function validateApprovalAction(value:unknown):Record<string,unknown>|null;
export declare function budgetMicros(amount:unknown):string|null;
export declare function createPausedCampaign(customer:string,draft:unknown,slug:string):{
 operations:unknown[];preview:Record<string,unknown>}|null;
export declare function existingCampaignOperation(customer:string,action:Record<string,unknown>,row:Record<string,unknown>):{
 operations:unknown[];preview:Record<string,unknown>}|null;
