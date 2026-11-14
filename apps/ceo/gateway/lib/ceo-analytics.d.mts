export declare const PERIOD_DAYS:Readonly<Record<"7d"|"30d"|"90d",number>>;
export declare function queriesFor(period:string):Record<"summary"|"daily"|"sources"|"products"|"categories"|"seoSummary"|"seoPages"|"funnel"|"marketingSources"|"marketingCampaigns"|"marketingPreviousSources"|"marketingDaily",string>;
export declare function formatStatistics(period:string,input:Record<string,{results:unknown[][];last_refresh?:string;is_cached?:boolean}>):{
 period:string;timezone:string;generatedAt:string;cached:boolean;
 metrics:Record<string,number>;
 daily:{day:string;visits:number;pageViews:number}[];
 sources:{label:string;count:number}[];
 products:{label:string;count:number}[];
 categories:{label:string;count:number}[];
 funnel:{viewedSessions:number;ctaSessions:number;submittedSessions:number};
 seo:Record<string,number>;
 seoPages:{label:string;count:number}[];
 marketing:{channels:{channel:string;sessions:number;productSessions:number;ctaSessions:number;leadSessions:number;contactSessions:number;outsourcingSessions:number}[];campaigns:{campaign:string;channel:string;sessions:number;productSessions:number;ctaSessions:number;leadSessions:number}[];previousChannels:{channel:string;sessions:number;productSessions:number;ctaSessions:number;leadSessions:number;contactSessions:number;outsourcingSessions:number}[];daily:{day:string;channel:string;sessions:number;leadSessions:number}[]};
};
