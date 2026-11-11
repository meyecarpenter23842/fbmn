// A JWT is only a credential to be forwarded to the existing Owner-guarded
// Worker; its contents must never be trusted by this parser.
const jwt=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
export function readBearerJwt(header){
 if(typeof header!=="string"||header.length>12007)return null;
 const match=/^Bearer ([^\s]+)$/.exec(header);
 return match&&match[1].length<=12000&&jwt.test(match[1])?match[1]:null;
}
