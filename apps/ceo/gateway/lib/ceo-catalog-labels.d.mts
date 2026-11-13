export type CeoCatalogRank = {label:string;count:number};
export function attachCatalogNames<
 T extends {products:CeoCatalogRank[];categories:CeoCatalogRank[]}
>(statistics:T,origin:string,transport?:typeof fetch):Promise<T & {labelsUnavailable:boolean}>;
