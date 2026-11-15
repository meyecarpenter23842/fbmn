export type AdsOAuthConfig={
 status:"ready";clientId:string;clientSecret:string;key:Buffer
}|{status:"unconfigured"};
export declare function adsOAuthConfig(env?:NodeJS.ProcessEnv):AdsOAuthConfig;
export declare function adsAuthorize(config:AdsOAuthConfig,subject:string,now?:number):string;
export declare function adsCallback(config:AdsOAuthConfig,code:string|null,state:string|null,now?:number):{
 code:string;verifier:string;subject:string}|null;
export declare function adsTicket(config:AdsOAuthConfig,callback:{
 code:string;verifier:string;subject:string},now?:number):string;
export declare function adsVerifyTicket(config:AdsOAuthConfig,ticket:string,subject:string,now?:number):{
 code:string;verifier:string;subject:string}|null;
export declare function adsExchangeCode(config:AdsOAuthConfig,code:string,verifier:string):Promise<{
 accessToken:string;refreshToken:string}>;
export declare function adsRefresh(config:AdsOAuthConfig,refresh:string):Promise<{
 accessToken:string;rotated:string|null}>;
export declare function adsRevoke(refresh:string):Promise<boolean>;
