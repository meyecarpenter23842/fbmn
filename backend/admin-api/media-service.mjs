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
  if(!["list","library","upload","file","link","order","scan","adopt","variant"].includes(action))
    return fail(404,"not_found");
  if(!db)return fail(503,"media_db_unavailable");
  if(!r2||typeof r2.put!=="function"||typeof r2.get!=="function")
    return fail(503,"media_storage_unavailable");
  const owner=actor.role==="owner";
  if(url.search&&action!=="list"&&action!=="file")return fail(400,"invalid_query");
  try{
    if(action==="variant"&&request.method==="POST"){
      if(!owner)return fail(403,"owner_required");
      const assetId=request.headers.get("x-fbmn-asset-id");
      const variant=request.headers.get("x-fbmn-variant");
      if(!uuid(assetId)||!["web","thumb"].includes(variant)||
        request.headers.get("content-type")?.split(";")[0]!=="image/webp")
        return fail(400,"invalid_variant_request");
      if(Number(request.headers.get("content-length")||0)>MAX_BYTES||!request.body)
        return fail(413,"media_too_large");
      const bytes=new Uint8Array(await request.arrayBuffer());
      const dimensions=bytes.length<=MAX_BYTES&&bytes.length>=32?
        imageSize(bytes,"image/webp",1):null;
      const longest=variant==="web"?1600:320;
      if(!dimensions||Math.max(dimensions.width,dimensions.height)>longest)
        return fail(422,"invalid_variant_image");
      const ref=await db(c=>c.query(
        "SELECT a.id FROM fbmn_catalog.media_assets a WHERE a.id=$1 AND a.r2_key IS NOT NULL "+ 
        "AND EXISTS(SELECT 1 FROM fbmn_catalog.sku_media l WHERE l.asset_id=a.id)",[assetId]));
      if(ref.rowCount!==1)return fail(404,"media_not_found");
      const key="private/catalogue/renditions/"+assetId+"/"+variant+".webp";
      // Idempotent derivative. Never replace the original object or DB link.
      await r2.put(key,bytes,{httpMetadata:{contentType:"image/webp"}});
      return json(201,{data:{id:assetId,variant,width:dimensions.width,
        height:dimensions.height,optimized:true}});
    }
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
          !key.startsWith(INBOX_PREFIX)||!/\.(png|jpe?g|webp)$/i.test(key)))
        return fail(400,"invalid_adopt_request");
      // Re-check the exact company SKU at commit time, even after a preview.
      const known=await db(c=>c.query(
        "SELECT sku_cong_ty FROM fbmn_catalog.skus ORDER BY sku_cong_ty LIMIT 20000"));
      const companySkus=new Set(known.rows.map(row=>row.sku_cong_ty));
      const resolved=input.keys.map(key=>({key,...detectSkuFromName(key,companySkus)}));
      if(resolved.some(item=>item.status!=="matched"))
        return fail(409,"sku_filename_conflict");
      const imgs=[];
      for(const entry of resolved){
        const item=await r2.get(entry.key);
        if(!item)return fail(404,"r2_image_not_found");
        if(item.size>MAX_BYTES||item.size<32)return fail(413,"media_too_large");
        const mime=/\.png$/i.test(entry.filename)?"image/png":
          /\.webp$/i.test(entry.filename)?"image/webp":"image/jpeg";
        const bytes=new Uint8Array(await item.arrayBuffer());
        if(bytes.length>MAX_BYTES||!imageSize(bytes,mime))
          return fail(422,"invalid_image_bytes");
        const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
        const hash=Array.from(digest,x=>x.toString(16).padStart(2,"0")).join("");
        imgs.push({...entry,mime,hash});
      }
      const output=await tx(db,async c=>{
        // One atomic DB transaction; R2 originals are never overwritten/deleted.
        const inserted=[];
        for(const img of imgs){
          const sku=await c.query(
            "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE",[img.sku]);
          if(sku.rowCount!==1)throw Error("sku_not_found");
          const existing=await c.query(
            "SELECT id FROM fbmn_catalog.media_assets WHERE r2_key=$1",[img.key]);
          if(existing.rowCount)throw Error("media_already_registered");
          const duplicate=await c.query(
            "SELECT a.id FROM fbmn_catalog.media_assets a JOIN fbmn_catalog.sku_media l "+ 
            "ON l.asset_id=a.id WHERE l.sku_cong_ty=$1 AND a.file_sha256=$2 LIMIT 1",
            [img.sku,img.hash]);
          if(duplicate.rowCount)throw Error("duplicate_sku_image");
          const linked=await c.query(
            "SELECT count(*)::int AS amount,coalesce(max(sort_order),-1)::int AS last_position "+ 
            "FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1",[img.sku]);
          if(Number(linked.rows[0].amount)>=MAX_PER_SKU)throw Error("media_limit");
          const assetId=crypto.randomUUID();
          await c.query(
            "INSERT INTO fbmn_catalog.media_assets(id,source_filename,r2_key,mime_type,file_sha256) "+ 
            "VALUES($1,$2,$3,$4,$5)",[assetId,img.filename,img.key,img.mime,img.hash]);
          await c.query(
            "INSERT INTO fbmn_catalog.sku_media(sku_cong_ty,asset_id,media_role,sort_order,match_method) "+ 
            "VALUES($1,$2,$3,$4,'filename_exact')",[img.sku,assetId,
            Number(linked.rows[0].amount)===0?"cover":"detail",Number(linked.rows[0].last_position)+1]);
          await audit(c,actor,"media_adopt_from_r2",
            {sku_cong_ty:img.sku,asset_id:assetId,published:false});
          inserted.push({sku:img.sku,asset_id:assetId});
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
        "WHERE a.r2_key IS NOT NULL GROUP BY a.id ORDER BY a.created_at DESC LIMIT 1000"));
      return json(200,{data:{items:rows.rows}});
    }
    if(action==="file"&&request.method==="GET"){
      const asset=url.searchParams.get("id");
      const variant=url.searchParams.get("variant");
      if(!uuid(asset)||url.searchParams.size>(variant?2:1)||
        (variant&&!["thumb","web"].includes(variant))||
        (variant&&url.searchParams.getAll("variant").length!==1)||
        url.searchParams.getAll("id").length!==1)
        return fail(400,"invalid_asset_id");
      const row=await db(c=>c.query(
        "SELECT a.r2_key,a.mime_type FROM fbmn_catalog.media_assets a "+
        "WHERE a.id=$1 AND a.r2_key IS NOT NULL "+
        "AND EXISTS(SELECT 1 FROM fbmn_catalog.sku_media l WHERE l.asset_id=a.id)",[asset]));
      if(row.rowCount!==1)return fail(404,"media_not_found");
      let object=variant?await r2.get("private/catalogue/renditions/"+asset+"/"+variant+".webp"):null;
      const optimized=Boolean(object);
      if(!object)object=await r2.get(row.rows[0].r2_key);
      if(!object)return fail(404,"media_not_found");
      return new Response(object.body,{status:200,headers:{
        ...HEADERS,"Content-Type":optimized?"image/webp":row.rows[0].mime_type,
        "Content-Disposition":"inline","Cross-Origin-Resource-Policy":"same-origin",
        "X-Content-Type-Options":"nosniff"
      }});
    }
    if(action==="upload"&&request.method==="POST"){
      if(!owner)return fail(403,"owner_required");
      const sku=request.headers.get("x-fbmn-sku");
      const mime=request.headers.get("content-type")?.split(";")[0]||"";
      if(!skuOk(sku)||!Object.hasOwn(MIME,mime))return fail(400,"invalid_media_request");
      const declared=Number(request.headers.get("content-length")||0);
      if(declared>MAX_BYTES||!request.body)return fail(413,"media_too_large");
      let filename;
      try{filename=decodeURIComponent(request.headers.get("x-fbmn-file-name")||"");}
      catch{return fail(400,"invalid_filename");}
      if(!filename||filename.length>200||/[\\/\x00-\x1f]/.test(filename)||
         !/\.(jpg|jpeg|png|webp)$/i.test(filename))return fail(400,"invalid_filename");
      const suffix=filename.split(".").pop().toLowerCase();
      if(!(mime==="image/jpeg"?["jpg","jpeg"].includes(suffix):suffix===MIME[mime]))
        return fail(400,"mime_filename_mismatch");
      const bytes=new Uint8Array(await request.arrayBuffer());
      if(bytes.byteLength<32||bytes.byteLength>MAX_BYTES)return fail(413,"media_too_large");
      const dimensions=imageSize(bytes,mime);
      if(!dimensions)return fail(422,"invalid_image_bytes");
      // The SKU comes from authenticated Admin context, NEVER an inferred filename.
      // Versioned UUID directory prevents overwriting even with concurrent uploads.
      const positions=await db(c=>c.query(
        "SELECT coalesce(max(sort_order),-1)::int AS last_position "+
        "FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1",[sku]));
      const measured=Number(positions.rows?.[0]?.last_position);
      const position=Number.isSafeInteger(measured)&&measured>=-1?measured+1:0;
      const canonical=sku+(position===0?"":"-"+String(position+1).padStart(2,"0"))+"."+MIME[mime];
      const assetId=crypto.randomUUID();
      const r2Key="private/catalogue/by-sku/"+encodeURIComponent(sku)+"/"+
        assetId+"/"+encodeURIComponent(canonical);
      const hex=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),
        b=>b.toString(16).padStart(2,"0")).join("");
      await r2.put(r2Key,bytes,{httpMetadata:{contentType:mime},
        customMetadata:{sha256:hex}});
      try{
        const row=await tx(db,async c=>{
          const selected=await c.query(
            "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE",[sku]);
          if(!selected.rowCount)throw Error("sku_not_found");
          const duplicate=await c.query(
            "SELECT a.id FROM fbmn_catalog.media_assets a JOIN fbmn_catalog.sku_media l "+
            "ON l.asset_id=a.id WHERE l.sku_cong_ty=$1 AND a.file_sha256=$2 LIMIT 1",
            [sku,hex]);
          if(duplicate.rowCount)throw Error("duplicate_sku_image");
          const linked=await c.query(
            "SELECT count(*)::int AS amount,coalesce(max(sort_order),-1)::int AS last_position "+
            "FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1",[sku]);
          if(Number(linked.rows[0].amount)>=MAX_PER_SKU)throw Error("media_limit");
          await c.query(
            "INSERT INTO fbmn_catalog.media_assets(id,source_filename,r2_key,mime_type,file_sha256) "+
            "VALUES($1,$2,$3,$4,$5)",[assetId,filename,r2Key,mime,hex]);
          await c.query(
            "INSERT INTO fbmn_catalog.sku_media(sku_cong_ty,asset_id,media_role,sort_order,match_method) "+
            "VALUES($1,$2,$3,$4,'manual')",[sku,assetId,
            Number(linked.rows[0].amount)===0?"cover":"detail",Number(linked.rows[0].last_position)+1]);
          await audit(c,actor,"media_upload",{sku_cong_ty:sku,asset_id:assetId,published:false});
          return {id:assetId,source_filename:filename,mime_type:mime,
            media_role:Number(linked.rows[0].amount)===0?"cover":"detail",...dimensions};
        });
        return json(201,{data:row});
      }catch(error){await r2.delete(r2Key).catch(()=>{});throw error;}
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
          "SELECT id FROM fbmn_catalog.media_assets WHERE id=$1 AND r2_key IS NOT NULL",[data.asset_id]);
        if(!asset.rowCount)throw Error("media_not_found");
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
    if(action==="link"&&request.method==="DELETE"){
      if(!owner)return fail(403,"owner_required");
      const data=await getJson(request);
      if(!skuOk(data?.sku_cong_ty)||!uuid(data?.asset_id))
        return fail(400,"invalid_media_request");
      const result=await tx(db,async c=>{
        const row=await c.query("SELECT sku_cong_ty FROM fbmn_catalog.skus "+
          "WHERE sku_cong_ty=$1 FOR UPDATE",[data.sku_cong_ty]);
        if(!row.rowCount)throw Error("sku_not_found");
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
        await audit(c,actor,"media_unlink",
          {sku_cong_ty:data.sku_cong_ty,asset_id:data.asset_id,published:false});
        return {unlinked:true}; // Keep R2 original: other SKUs may use it.
      });
      return json(200,{data:result});
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
    if(["sku_not_found","media_not_found"].includes(error?.message))return fail(404,error.message);
    if(error?.message==="media_limit")return fail(409,"media_limit");
    if(["media_conflict","media_already_linked","media_already_registered","duplicate_sku_image"].includes(error?.message))return fail(409,error.message);
    if(error?.message==="invalid_body")return fail(400,"invalid_body");
    return fail(503,"media_unavailable");
  }
}
