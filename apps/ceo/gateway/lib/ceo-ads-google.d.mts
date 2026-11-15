export declare function adsAccessibleCustomers(token:string):Promise<string[]>;
export declare function adsCustomerInfo(customer:string,token:string,login:string|null):Promise<{
 id:string;name:string;currency:string;timeZone:string}>;
export declare function adsGeoSuggestions(token:string,login:string|null,names:string[]):Promise<unknown[]>;
export declare function adsKeywordsHistorical(customer:string,token:string,login:string|null,
 words:string[],geos:string[]):Promise<unknown>;
export declare function adsKeywordIdeas(customer:string,token:string,login:string|null,
 words:string[],geos:string[]):Promise<unknown>;
export declare function adsCampaigns(customer:string,token:string,login:string|null):Promise<Array<{
 id:string;name:string;status:string;type:string;dailyBudget:number|null;
 budgetResource:string;explicitlyShared:boolean
}>>;
export declare function adsPerformance(customer:string,token:string,login:string|null,
 period:string,timezone:string):Promise<unknown>;

export declare function adsMutate(customer:string,token:string,login:string|null,
 operations:unknown[],validateOnly:boolean):Promise<Record<string,unknown>>;
