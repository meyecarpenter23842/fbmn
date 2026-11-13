export declare const PERIOD_DAYS:Readonly<Record<"7d"|"30d"|"90d",number>>;
export declare function queriesFor(period:string):Record<"summary"|"daily"|"sources"|"products"|"categories",string>;
export declare function formatStatistics(period:string,input:Record<string,{results:unknown[][]}>):{
 period:string;timezone:string;generatedAt:string;
 metrics:Record<string,number>;
 daily:{day:string;visits:number;pageViews:number}[];
 sources:{label:string;count:number}[];
 products:{label:string;count:number}[];
 categories:{label:string;count:number}[];
};
