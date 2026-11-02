import {detectSkuFromName,findR2SkuCandidates,INBOX_PREFIX} from "./media-sku-sync.mjs";
// P4: private R2 media management. NEVER a public publication/read endpoint.
// A company SKU is always an exact string; no filename-based SKU inference.
const ROLES=new Set(["owner","admin","editor"]);
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const json=(status,data)=>Response.json(data,{status,headers:HEADERS});
const fail=(status,code)=>json(status,{error:{code}});
const skuOk=value=>typeof value==="string"&&value.length>0&&value.length<=80&&
  value.trim()===value&&!/[\x00-\x1f\x7f]/.test(value);
const uuid=value=>typeof value==="string"&&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const MIME={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"};
const canonicalKey=(sku,index)=>"private/catalogue/"+encodeURIComponent(sku)+(index===1?"":"-"+String(index).padStart(2,"0"))+".webp";
const MAX_BYTES=5*1024*1024,MAX_PER_SKU=20;
function imageSize(bytes,mime,minEdge=32){
  const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const string=(i,n)=>String.fromCharCode(...bytes.subarray(i,i+n));
  let width=0,height=0;
  if(mime==="image/png"&&bytes.length>=33&&
    bytes.subarray(0,8).every((v,i)=>v===[137,80,78,71,13,10,26,10][i])&&
    string(12,4)==="IHDR"){
    width=dv.getUint32(16);height=dv.getUint32(20);
    // Reject header-only or truncated PNGs. Require complete IDAT and IEND.
    let index=8,hasIdat=false,hasIend=false;
    while(index+12<=bytes.length){
      const len=dv.getUint32(index),type=string(index+4,4);
      if(len>MAX_BYTES||index+12+len>bytes.length)break;
      if(type==="IDAT"&&len>0)hasIdat=true;
      if(type==="IEND"&&len===0){hasIend=index+12===bytes.length;break;}
      index+=12+len;
    }
    if(!hasIdat||!hasIend)return null;
  }else if(mime==="image/webp"&&bytes.length>=26&&
    string(0,4)==="RIFF"&&string(8,4)==="WEBP"){
    if(dv.getUint32(4,true)!==bytes.length-8)return null;
    let at=12,canvas=null,codec=null;
    // Verify complete RIFF chunks, padding, and an actual encoded image
    // payload: a VP8X canvas header alone is not a decodable picture.
    while(at+8<=bytes.length){
      const tag=string(at,4),length=dv.getUint32(at+4,true);
      const start=at+8,end=start+length,next=end+(length&1);
      if(!length||length>MAX_BYTES||next>bytes.length)return null;
      if(tag==="VP8X"&&length>=10){
        canvas={width:1+bytes[start+4]+(bytes[start+5]<<8)+(bytes[start+6]<<16),
          height:1+bytes[start+7]+(bytes[start+8]<<8)+(bytes[start+9]<<16)};
      }else if(tag==="VP8 "&&length>=10&&bytes[start+3]===0x9d&&
        bytes[start+4]===0x01&&bytes[start+5]===0x2a){
        codec={width:dv.getUint16(start+6,true)&0x3fff,
          height:dv.getUint16(start+8,true)&0x3fff};
      }else if(tag==="VP8L"&&length>=6&&bytes[start]===0x2f){
        codec={width:1+(((bytes[start+2]&0x3f)<<8)|bytes[start+1]),
          height:1+(((bytes[start+4]&0x0f)<<10)|
            (bytes[start+3]<<2)|((bytes[start+2]&0xc0)>>6))};
      }
      at=next;
    }
    if(at!==bytes.length||!codec)return null;
    if(canvas&&(canvas.width!==codec.width||canvas.height!==codec.height))
      return null; // No animation or mismatched canvas/codec dimensions.
    width=codec.width;height=codec.height;
  }else if(mime==="image/jpeg"&&bytes.length>12&&bytes[0]===0xff&&bytes[1]===0xd8&&
    bytes[bytes.length-2]===0xff&&bytes[bytes.length-1]===0xd9){
    let i=2;
    while(i+9<bytes.length){
      if(bytes[i]!==0xff)break;
      let marker=bytes[i+1];i+=2;
      while(marker===0xff&&i<bytes.length)marker=bytes[i++];
      if(marker===0xda||marker===0xd9)break;
      if([0x01,0xd0,0xd1,0xd2,0xd3,0xd4,0xd5,0xd6,0xd7].includes(marker))continue;
      if(i+2>bytes.length)break;
      const size=dv.getUint16(i);
      if(size<2||i+size>bytes.length)break;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&size>=7){
        height=dv.getUint16(i+3);width=dv.getUint16(i+5);break;
      }
      i+=size;
    }
  }
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
    width<minEdge||height<minEdge||width>8192||height>8192)return null;
  return {width,height};
}
export {imageSize};
const tx=(db,fn)=>db(async c=>{await c.query("BEGIN");try{
  const result=await fn(c);await c.query("COMMIT");return result;
}catch(error){await c.query("ROLLBACK");throw error;}});
// Transaction-scoped per-R2-key lock serializes distinct SKUs with colliding
// canonical filenames. Cleanup occurs BEFORE ROLLBACK releases the key lock.
// Hyperdrive connections must never retain session-level advisory locks.
const txR2=(db,r2,fn)=>db(async c=>{
  await c.query("BEGIN");
  let newKey=null,commitAttempted=false;
  const guard={
    async lock(key){
      await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))",[key]);
    },
    track(key){newKey=key;}
  };
  try{
    const data=await fn(c,guard);
    commitAttempted=true;
    await c.query("COMMIT");
    return data;
  }catch(error){
    // Only compensate an unquestionably uncommitted upload.
    // A COMMIT with an uncertain outcome must NOT lose an R2 image.
    if(newKey&&!commitAttempted&&typeof r2.delete==="function")
      await r2.delete(newKey).catch(()=>{});
    await c.query("ROLLBACK").catch(()=>{});
    throw error;
  }
});
// Keep cleanup jobs in SQL until R2 deletion and metadata cleanup both succeed.
async function finishCleanup(db,r2,assetId){
  const observed=await db(c=>c.query(
    "SELECT j.r2_key FROM fbmn_catalog.media_cleanup_jobs j WHERE j.asset_id=$1",
    [assetId]));
  if(!observed.rowCount)return {file_deleted:false,pending:false};
  const key=observed.rows[0].r2_key;
  if(typeof r2.delete!=="function")return {file_deleted:false,pending:true};
  // Use EXACT SAME transaction-scoped key lock as upload. Revalidate the queued
  // cleanup after acquiring the lock to prevent stale second deletions of a
  // new asset that reused the same canonical name.
  return db(async c=>{
    await c.query("BEGIN");
    try{
      const lockAsset=await c.query(
        "SELECT id FROM fbmn_catalog.media_assets WHERE id=$1 FOR UPDATE",[assetId]);
      if(!lockAsset.rowCount){await c.query("COMMIT");return {file_deleted:false,pending:false};}
      await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))",[key]);
      const job=await c.query(
        "SELECT j.r2_key FROM fbmn_catalog.media_cleanup_jobs j "+
        "WHERE j.asset_id=$1 AND j.r2_key=$2 AND "+
        "NOT EXISTS(SELECT 1 FROM fbmn_catalog.sku_media l WHERE l.asset_id=j.asset_id)",[assetId,key]);
      if(!job.rowCount){
        await c.query("COMMIT");
        return {file_deleted:false,pending:false};
      }
      await r2.delete(key);
      const gone=await c.query(
        "DELETE FROM fbmn_catalog.media_assets a WHERE a.id=$1 AND a.r2_key=$2 "+
        "AND NOT EXISTS(SELECT 1 FROM fbmn_catalog.sku_media l WHERE l.asset_id=a.id) "+
        "AND EXISTS(SELECT 1 FROM fbmn_catalog.media_cleanup_jobs j "+
        "WHERE j.asset_id=a.id AND j.r2_key=$2) RETURNING a.id",[assetId,key]);
      if(!gone.rowCount)throw Error("cleanup_conflict");
      await c.query("COMMIT");
      return {file_deleted:true,pending:false};
    }catch{
      // Staged unlink was committed earlier; any failed cleanup stays queued
      // and retryable. Never resurrect a live SKU link pointing to deleted bytes.
      await c.query("ROLLBACK").catch(()=>{});
      return {file_deleted:false,pending:true};
    }
  });
}
const audit=(c,actor,operation,detail)=>c.query(
  "INSERT INTO fbmn_catalog.audit_events(actor_subject,sku_cong_ty,operation,after_json) VALUES($1,$2,$3,$4::jsonb)",
  [actor.subject,detail.sku_cong_ty,operation,JSON.stringify(detail)]);
const getJson=async request=>{
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")
    throw Error("invalid_body");
  if(Number(request.headers.get("content-length")||0)>8000)throw Error("invalid_body");
  const raw=await request.text();if(raw.length>8000)throw Error("invalid_body");
  return JSON.parse(raw);
};
export async function handleMedia({request,actor,db,r2}){
  if(!ROLES.has(actor?.role))return fail(403,"forbidden");
  const url=new URL(request.url),action=url.pathname.slice("/v1/admin/catalogue/media/".length);
  if(!["list","library","upload","file","link","order","scan","adopt","cleanup"].includes(action))
    return fail(404,"not_found");
  if(!db)return fail(503,"media_db_unavailable");
  if(!r2||typeof r2.put!=="function"||typeof r2.get!=="function")
    return fail(503,"media_storage_unavailable");
  const owner=actor.role==="owner";
  if(url.search&&action!=="list"&&action!=="file")return fail(400,"invalid_query");
  try{
    if(action==="scan"&&request.method==="GET"){
      if(!owner)return fail(403,"owner_required");
      const results=await findR2SkuCandidates({db,r2});
      return json(200,{data:results});
    }
    if(action==="adopt"&&request.method==="POST"){
      if(!owner)return fail(403,"owner_required");
      const input=await getJson(request);
      if(input?.confirm!=="GAN_ANH_R2"||!Array.isArray(input.keys)||
        input.keys.length<1||input.keys.length>10||new Set(input.keys).size!==input.keys.length||
        input.keys.some(key=>typeof key!=="string"||key.length>500||
          !key.startsWith(INBOX_PREFIX)||!/\.webp$/i.test(key)))
        return fail(400,"invalid_adopt_request");
      // Re-check the exact company SKU at commit time, even after a preview.
      const known=await db(c=>c.query(
        "SELECT sku_cong_ty FROM fbmn_catalog.skus ORDER BY sku_cong_ty LIMIT 20000"));
      const companySkus=new Set(known.rows.map(row=>row.sku_cong_ty));
      const resolved=input.keys.map(key=>({key,...detectSkuFromName(key,companySkus)}));
      if(resolved.some(item=>item.status!=="matched"))
        return fail(409,"sku_filename_conflict");
      const output=await tx(db,async c=>{
        // Lock SKU and canonical R2 key BEFORE reading object bytes. This
        // serializes adoption with upload/rollback cleanup for the same key.
        // Stable order prevents a multi-key adoption deadlock.
        const inserted=[];
        for(const entry of [...resolved].sort((a,b)=>a.sku.localeCompare(b.sku)||a.key.localeCompare(b.key))){
          const sku=await c.query(
            "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE",[entry.sku]);
          if(sku.rowCount!==1)throw Error("sku_not_found");
          await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))",[entry.key]);
          const existing=await c.query(
            "SELECT id FROM fbmn_catalog.media_assets WHERE r2_key=$1",[entry.key]);
          if(existing.rowCount)throw Error("media_already_registered");
          const item=await r2.get(entry.key);
          if(!item)throw Error("r2_image_not_found");
          if(item.size>MAX_BYTES||item.size<32)throw Error("media_too_large");
          const bytes=new Uint8Array(await item.arrayBuffer());
          if(bytes.length>MAX_BYTES||!imageSize(bytes,"image/webp",1))
            throw Error("invalid_image_bytes");
          const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
          const hash=Array.from(digest,x=>x.toString(16).padStart(2,"0")).join("");
          const duplicate=await c.query(
            "SELECT a.id FROM fbmn_catalog.media_assets a JOIN fbmn_catalog.sku_media l "+
            "ON l.asset_id=a.id WHERE l.sku_cong_ty=$1 AND a.file_sha256=$2 LIMIT 1",
            [entry.sku,hash]);
          if(duplicate.rowCount)throw Error("duplicate_sku_image");
          const linked=await c.query(
            "SELECT count(*)::int AS amount,coalesce(max(sort_order),-1)::int AS last_position "+
            "FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1",[entry.sku]);
          if(Number(linked.rows[0].amount)>=MAX_PER_SKU)throw Error("media_limit");
          const assetId=crypto.randomUUID();
          await c.query(
            "INSERT INTO fbmn_catalog.media_assets(id,source_filename,r2_key,mime_type,file_sha256) "+
            "VALUES($1,$2,$3,$4,$5)",[assetId,entry.filename,entry.key,"image/webp",hash]);
          await c.query(
            "INSERT INTO fbmn_catalog.sku_media(sku_cong_ty,asset_id,media_role,sort_order,match_method) "+
            "VALUES($1,$2,$3,$4,'filename_exact')",[entry.sku,assetId,
            Number(linked.rows[0].amount)===0?"cover":"detail",Number(linked.rows[0].last_position)+1]);
          await audit(c,actor,"media_adopt_from_r2",
            {sku_cong_ty:entry.sku,asset_id:assetId,published:false});
          inserted.push({sku:entry.sku,asset_id:assetId});
        }
        return inserted;
      });
      return json(201,{data:{items:output,count:output.length,published:0}});
    }
    if(action==="list"&&request.method==="GET"){
      const sku=url.searchParams.get("sku");
      if(url.searchParams.size!==1||!skuOk(sku))return fail(400,"invalid_sku");
      const rows=await db(c=>c.query(
        "SELECT a.id::text AS id,a.source_filename,a.mime_type,a.file_sha256,"+
        "l.media_role,l.sort_order,s.sku_cong_ty FROM fbmn_catalog.sku_media l "+
        "JOIN fbmn_catalog.media_assets a ON a.id=l.asset_id "+
        "JOIN fbmn_catalog.skus s ON s.sku_cong_ty=l.sku_cong_ty "+
        "WHERE l.sku_cong_ty=$1 ORDER BY l.sort_order,a.created_at,a.id LIMIT 20",[sku]));
      return json(200,{data:{items:rows.rows}});
    }
    if(action==="library"&&request.method==="GET"){
      const rows=await db(c=>c.query(
        "SELECT a.id::text AS id,a.source_filename,a.mime_type,"+
        "count(l.sku_cong_ty)::int AS linked_skus "+
        "FROM fbmn_catalog.media_assets a LEFT JOIN fbmn_catalog.sku_media l ON l.asset_id=a.id "+
        "WHERE a.r2_key IS NOT NULL AND NOT EXISTS(SELECT 1 FROM fbmn_catalog.media_cleanup_jobs j WHERE j.asset_id=a.id) "+
        "GROUP BY a.id ORDER BY a.created_at DESC LIMIT 1000"));
      return json(200,{data:{items:rows.rows}});
    }
    if(action==="file"&&request.method==="GET"){
      const asset=url.searchParams.get("id");
      if(!uuid(asset)||url.searchParams.size!==1||url.searchParams.getAll("id").length!==1)
        return fail(400,"invalid_asset_id");
      const row=await db(c=>c.query(
        "SELECT a.r2_key,a.mime_type FROM fbmn_catalog.media_assets a "+
        "WHERE a.id=$1 AND a.r2_key IS NOT NULL "+
        "AND EXISTS(SELECT 1 FROM fbmn_catalog.sku_media l WHERE l.asset_id=a.id)",[asset]));
      if(row.rowCount!==1)return fail(404,"media_not_found");
      const object=await r2.get(row.rows[0].r2_key);
      if(!object)return fail(404,"media_not_found");
      return new Response(object.body,{status:200,headers:{
        ...HEADERS,"Content-Type":row.rows[0].mime_type,
        "Content-Disposition":"inline","Cross-Origin-Resource-Policy":"same-origin"
      }});
    }
    if(action==="upload"&&request.method==="POST"){
      if(!owner)return fail(403,"owner_required");
      const sku=request.headers.get("x-fbmn-sku");
      const replacing=request.headers.get("x-fbmn-asset-id");
      const mime=request.headers.get("content-type")?.split(";")[0]||"";
      if(!skuOk(sku)||mime!=="image/webp"||(replacing&&!uuid(replacing)))
        return fail(400,"webp_only");
      if(Number(request.headers.get("content-length")||0)>MAX_BYTES||!request.body)
        return fail(413,"media_too_large");
      const bytes=new Uint8Array(await request.arrayBuffer());
      if(bytes.length<32||bytes.length>MAX_BYTES)return fail(413,"media_too_large");
      const dimensions=imageSize(bytes,"image/webp",1);
      if(!dimensions||Math.max(dimensions.width,dimensions.height)>1600)
        return fail(422,"invalid_webp_dimensions");
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),
        b=>b.toString(16).padStart(2,"0")).join("");
      const saved=await txR2(db,r2,async(c,guard)=>{
        const selected=await c.query(
          "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE",[sku]);
        if(!selected.rowCount)throw Error("sku_not_found");
        const current=await c.query(
          "SELECT a.id::text AS id,a.r2_key,l.sort_order,l.media_role "+
          "FROM fbmn_catalog.sku_media l JOIN fbmn_catalog.media_assets a "+
          "ON a.id=l.asset_id WHERE l.sku_cong_ty=$1 ORDER BY l.sort_order",[sku]);
        let entry=null,key="",assetId="",index=1;
        if(replacing){
          entry=current.rows.find(r=>r.id===replacing);
          if(!entry||!entry.r2_key.startsWith("private/catalogue/")||
             !entry.r2_key.endsWith(".webp"))throw Error("media_not_found");
          // Serialize with a simultaneous library attach before the shared-link count.
          const locked=await c.query(
            "SELECT id FROM fbmn_catalog.media_assets WHERE id=$1 FOR UPDATE",[replacing]);
          if(!locked.rowCount)throw Error("media_not_found");
          const uses=await c.query(
            "SELECT count(*)::int AS amount FROM fbmn_catalog.sku_media WHERE asset_id=$1",
            [replacing]);
          if(Number(uses.rows[0].amount)!==1)throw Error("shared_media_replace_forbidden");
          key=entry.r2_key;assetId=replacing;
        }else{
          if(current.rowCount>=MAX_PER_SKU)throw Error("media_limit");
          const duplicate=await c.query(
            "SELECT a.id FROM fbmn_catalog.media_assets a JOIN fbmn_catalog.sku_media l "+
            "ON l.asset_id=a.id WHERE l.sku_cong_ty=$1 AND a.file_sha256=$2 LIMIT 1",
            [sku,hash]);
          if(duplicate.rowCount)throw Error("duplicate_sku_image");
          const names=new Set(current.rows.map(r=>r.r2_key));
          while(names.has(canonicalKey(sku,index))&&index<=MAX_PER_SKU)index++;
          if(index>MAX_PER_SKU)throw Error("media_limit");
          key=canonicalKey(sku,index);
          assetId=crypto.randomUUID();
        }
        await guard.lock(key);
        if(!replacing){
          const claimed=await c.query(
            "SELECT id FROM fbmn_catalog.media_assets WHERE r2_key=$1 LIMIT 1",[key]);
          if(claimed.rowCount||(typeof r2.head==="function"&&await r2.head(key)))
            throw Error("r2_file_exists_use_scan");
        }
        await r2.put(key,bytes,{httpMetadata:{contentType:"image/webp"},customMetadata:{sha256:hash}});
        if(!replacing)guard.track(key);
        if(replacing){
          await c.query(
            "UPDATE fbmn_catalog.media_assets SET mime_type='image/webp',"+
            "source_filename=$2,file_sha256=$3 WHERE id=$1",
            [assetId,key.slice(key.lastIndexOf("/")+1),hash]);
        }else{
          await c.query(
            "INSERT INTO fbmn_catalog.media_assets(id,source_filename,r2_key,mime_type,file_sha256) "+
            "VALUES($1,$2,$3,'image/webp',$4)",
            [assetId,key.slice(key.lastIndexOf("/")+1),key,hash]);
          const position=Math.max(-1,...current.rows.map(r=>Number(r.sort_order)))+1;
          await c.query(
            "INSERT INTO fbmn_catalog.sku_media(sku_cong_ty,asset_id,media_role,sort_order,match_method) "+
            "VALUES($1,$2,$3,$4,'manual')",
            [sku,assetId,current.rowCount===0?"cover":"detail",position]);
        }
        await audit(c,actor,replacing?"media_replace_webp":"media_upload_webp",
          {sku_cong_ty:sku,asset_id:assetId,published:false});
        return {id:assetId,source_filename:key.slice(key.lastIndexOf("/")+1),
          mime_type:"image/webp",media_role:replacing?entry.media_role:(current.rowCount===0?"cover":"detail"),
          replaced:Boolean(replacing),...dimensions};
      });
      return json(replacing?200:201,{data:saved});
    }
    if(action==="link"&&request.method==="POST"){
      if(!owner)return fail(403,"owner_required");
      const data=await getJson(request);
      if(!skuOk(data?.sku_cong_ty)||!uuid(data?.asset_id))
        return fail(400,"invalid_media_request");
      const linked=await tx(db,async c=>{
        const sku=await c.query(
          "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE",[data.sku_cong_ty]);
        if(!sku.rowCount)throw Error("sku_not_found");
        const asset=await c.query(
          "SELECT id FROM fbmn_catalog.media_assets WHERE id=$1 AND r2_key IS NOT NULL FOR UPDATE",
          [data.asset_id]);
        if(!asset.rowCount)throw Error("media_not_found");
        // Use a fresh statement/snapshot AFTER obtaining the asset lock.
        const cleanup=await c.query(
          "SELECT asset_id FROM fbmn_catalog.media_cleanup_jobs WHERE asset_id=$1",
          [data.asset_id]);
        if(cleanup.rowCount)throw Error("media_cleanup_pending");
        const links=await c.query(
          "SELECT asset_id,sort_order FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1",[data.sku_cong_ty]);
        if(links.rowCount>=MAX_PER_SKU)throw Error("media_limit");
        if(links.rows.some(row=>String(row.asset_id).toLowerCase()===data.asset_id.toLowerCase()))
          throw Error("media_already_linked");
        await c.query(
          "INSERT INTO fbmn_catalog.sku_media(sku_cong_ty,asset_id,media_role,sort_order,match_method) "+
          "VALUES($1,$2,$3,$4,'manual')",[data.sku_cong_ty,data.asset_id,
          links.rowCount===0?"cover":"detail",
          Math.max(-1,...links.rows.map(row=>Number(row.sort_order)))+1]);
        await audit(c,actor,"media_link",
          {sku_cong_ty:data.sku_cong_ty,asset_id:data.asset_id,published:false});
        return {linked:true};
      });
      return json(201,{data:linked});
    }
    if(action==="cleanup"&&request.method==="POST"){
      if(!owner)return fail(403,"owner_required");
      const body=await getJson(request);
      if(body?.confirm!=="DON_ANH_THUA")return fail(400,"invalid_body");
      const pending=await db(c=>c.query(
        "SELECT asset_id::text AS id FROM fbmn_catalog.media_cleanup_jobs "+
        "ORDER BY created_at,asset_id LIMIT 50"));
      let completed=0,remaining=0;
      for(const item of pending.rows){
        const cleaned=await finishCleanup(db,r2,item.id);
        if(cleaned.file_deleted)completed++;
        if(cleaned.pending)remaining++;
      }
      return json(200,{data:{completed,remaining}});
    }
    if(action==="link"&&request.method==="DELETE"){
      if(!owner)return fail(403,"owner_required");
      const data=await getJson(request);
      if(!skuOk(data?.sku_cong_ty)||!uuid(data?.asset_id))
        return fail(400,"invalid_media_request");
      const detached=await tx(db,async c=>{
        const row=await c.query("SELECT sku_cong_ty FROM fbmn_catalog.skus "+
          "WHERE sku_cong_ty=$1 FOR UPDATE",[data.sku_cong_ty]);
        if(!row.rowCount)throw Error("sku_not_found");
        const lockedAsset=await c.query(
          "SELECT id FROM fbmn_catalog.media_assets WHERE id=$1 FOR UPDATE",[data.asset_id]);
        if(!lockedAsset.rowCount)throw Error("media_not_found");
        const deleted=await c.query(
          "DELETE FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1 AND asset_id=$2 "+
          "RETURNING media_role",[data.sku_cong_ty,data.asset_id]);
        if(!deleted.rowCount)throw Error("media_not_found");
        if(deleted.rows[0].media_role==="cover"){
          await c.query("UPDATE fbmn_catalog.sku_media SET media_role='cover' "+
            "WHERE (sku_cong_ty,asset_id) IN (SELECT sku_cong_ty,asset_id FROM "+
            "fbmn_catalog.sku_media WHERE sku_cong_ty=$1 ORDER BY sort_order,asset_id LIMIT 1)",
            [data.sku_cong_ty]);
        }
        const unused=await c.query(
          "SELECT a.r2_key FROM fbmn_catalog.media_assets a WHERE a.id=$1 "+
          "AND NOT EXISTS(SELECT 1 FROM fbmn_catalog.sku_media l WHERE l.asset_id=a.id) "+
          "FOR UPDATE",[data.asset_id]);
        if(unused.rowCount){
          await c.query(
            "INSERT INTO fbmn_catalog.media_cleanup_jobs(asset_id,r2_key,sku_cong_ty) "+
            "VALUES($1,$2,$3) ON CONFLICT(asset_id) DO NOTHING",
            [data.asset_id,unused.rows[0].r2_key,data.sku_cong_ty]);
        }
        await audit(c,actor,"media_unlink",
          {sku_cong_ty:data.sku_cong_ty,asset_id:data.asset_id,published:false});
        return {orphan:unused.rowCount===1};
      });
      const cleaned=detached.orphan?await finishCleanup(db,r2,data.asset_id):
        {file_deleted:false,pending:false};
      return json(200,{data:{unlinked:true,...cleaned}});
    }
    if(action==="order"&&request.method==="PATCH"){
      if(!owner)return fail(403,"owner_required");
      const data=await getJson(request);
      if(!skuOk(data?.sku_cong_ty)||!Array.isArray(data?.asset_ids)||
        !data.asset_ids.length||data.asset_ids.length>MAX_PER_SKU||
        data.asset_ids.some(id=>!uuid(id))||new Set(data.asset_ids).size!==data.asset_ids.length||
        !data.asset_ids.includes(data.cover_id))return fail(400,"invalid_media_order");
      const result=await tx(db,async c=>{
        const sku=await c.query("SELECT sku_cong_ty FROM fbmn_catalog.skus "+
          "WHERE sku_cong_ty=$1 FOR UPDATE",[data.sku_cong_ty]);
        if(!sku.rowCount)throw Error("sku_not_found");
        const current=await c.query(
          "SELECT asset_id::text AS id FROM fbmn_catalog.sku_media "+
          "WHERE sku_cong_ty=$1 FOR UPDATE",[data.sku_cong_ty]);
        const set=new Set(current.rows.map(row=>row.id));
        if(set.size!==data.asset_ids.length||
          data.asset_ids.some(id=>!set.has(id)))throw Error("media_conflict");
        // First clear previous cover so at most one cover can be visible at commit.
        await c.query("UPDATE fbmn_catalog.sku_media SET media_role='detail' "+
          "WHERE sku_cong_ty=$1",[data.sku_cong_ty]);
        for(let i=0;i<data.asset_ids.length;i++){
          await c.query("UPDATE fbmn_catalog.sku_media SET sort_order=$3 "+
            "WHERE sku_cong_ty=$1 AND asset_id=$2",
            [data.sku_cong_ty,data.asset_ids[i],i]);
        }
        await c.query("UPDATE fbmn_catalog.sku_media SET media_role='cover' "+
          "WHERE sku_cong_ty=$1 AND asset_id=$2",[data.sku_cong_ty,data.cover_id]);
        await audit(c,actor,"media_reorder",
          {sku_cong_ty:data.sku_cong_ty,cover_id:data.cover_id,count:data.asset_ids.length,published:false});
        return {ordered:data.asset_ids.length};
      });
      return json(200,{data:result});
    }
    return fail(405,"method_not_allowed");
  }catch(error){
    if(["sku_not_found","media_not_found","r2_image_not_found"].includes(error?.message))return fail(404,error.message);
    if(error?.message==="media_limit")return fail(409,"media_limit");
    if(error?.message==="media_too_large")return fail(413,"media_too_large");
    if(error?.message==="invalid_image_bytes")return fail(422,"invalid_image_bytes");
    if(["media_conflict","media_already_linked","media_already_registered","duplicate_sku_image","media_cleanup_pending","r2_file_exists_use_scan","shared_media_replace_forbidden","webp_only"].includes(error?.message))return fail(409,error.message);
    if(error?.message==="invalid_body")return fail(400,"invalid_body");
    return fail(503,"media_unavailable");
  }
}
