export declare const ADS_PERIODS:Readonly<Record<"7d"|"30d"|"90d",number>>;
export declare const CUSTOMER:RegExp;
export declare const GEO:RegExp;
export declare function validCustomer(id:unknown):boolean;
export declare function safeKeywords(value:unknown):string[]|null;
export declare function safeGeos(value:unknown):string[]|null;
export declare function moneyFromMicros(value:unknown):number|null;
export declare function validLandingUrl(value:unknown):boolean;
export declare function validateDraft(value:unknown):Record<string,unknown>|null;
export declare function reportingDates(period:string,localToday:string):{
 from:string;to:string;previousFrom:string;previousTo:string}|null;
export declare function googleReportRows(rows:unknown):{
 daily:{date:string;clicks:number;impressions:number;cost:number}[];
 totals:{clicks:number;impressions:number;cost:number;ctr:number|null;cpc:number|null}}|null;
