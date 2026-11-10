/** StPageFlip renders spreads; the last left page may have a right partner. */
export function spreadStart(index:number,portrait:boolean,hasCover:boolean):number{
 if(portrait)return index;
 if(hasCover&&index===0)return 0;
 return hasCover?1+Math.floor(Math.max(0,index-1)/2)*2:Math.floor(index/2)*2;
}
export function canFlipForward(index:number,count:number,portrait:boolean,hasCover:boolean):boolean{
 if(!Number.isInteger(index)||count<=0||index<0||index>=count)return false;
 const start=spreadStart(index,portrait,hasCover);
 const step=portrait?1:hasCover&&start===0?1:2;
 return start+step<count;
}
export function canFlipBackward(index:number,portrait:boolean,hasCover:boolean):boolean{
 if(!Number.isInteger(index)||index<=0)return false;
 return spreadStart(index,portrait,hasCover)>0;
}
