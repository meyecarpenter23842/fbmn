import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'ceo_indexing_models.dart';
import 'ceo_repository.dart';
import 'ceo_ui_tokens.dart';
import 'gsc_oauth_navigation_stub.dart' if (dart.library.js_interop)
 'gsc_oauth_navigation_web.dart' as google_nav;

/// SEO P3 lives in the existing Statistics > SEO tab. Inspections only happen
/// on explicit per-URL clicks to avoid burning the Google Inspection API quota.
class CeoP3IndexingPanel extends StatefulWidget{
 final CeoRepository api;
 final Future<CeoP3Watchlist> Function()? loadWatchlist;
 final Future<CeoP3Audit> Function(String)? inspectUrl;
 const CeoP3IndexingPanel({super.key,required this.api,this.loadWatchlist,this.inspectUrl});
 @override State<CeoP3IndexingPanel> createState()=>_CeoP3IndexingPanelState();
}
class _CeoP3IndexingPanelState extends State<CeoP3IndexingPanel>{
 CeoP3Watchlist? watchlist;
 final Map<String,CeoP3Audit> checks={};
 bool loading=false;
 String error='';
 String? inspecting,copied;
 @override void initState(){
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_){
   if(mounted)unawaited(load());
  });
 }
 Future<void> load()async{
  if(loading)return;
  setState((){loading=true;error='';});
  try{
   final report=await (widget.loadWatchlist?.call() ?? widget.api.indexingWatchlist());
   if(mounted)setState((){watchlist=report;loading=false;});
  }catch(_){
   if(mounted)setState((){
    loading=false;error='Không tải được danh sách P3. Kiểm tra quyền SEO rồi thử lại.';
   });
  }
 }
 Future<void> inspect(CeoP3Url target)async{
  if(inspecting!=null)return;
  setState((){inspecting=target.key;error='';});
  try{
   final result=await (widget.inspectUrl?.call(target.key) ?? widget.api.inspectIndexingUrl(target.key));
   if(mounted)setState((){checks[target.key]=result;inspecting=null;});
  }catch(_){
   if(mounted)setState((){
    inspecting=null;
    error='Không thể kiểm tra '+target.label+'. Anh thử lại hoặc kiểm tra kết nối CEO.';
   });
  }
 }
 Future<void> copyUrl(CeoP3Url target)async{
  await Clipboard.setData(ClipboardData(text:target.url));
  if(mounted)setState(()=>copied=target.key);
 }
 void openGoogle(CeoP3Audit? result){
  google_nav.openGoogleInspection(result?.inspectionLink??
   'https://search.google.com/search-console');
 }
 Widget note(String text)=>Text(text,style:const TextStyle(
  color:ceoMuted,fontSize:12,height:1.45));
 Widget detailLabel(String title,String value)=>Padding(
  padding:const EdgeInsets.only(bottom:5),child:Row(
   crossAxisAlignment:CrossAxisAlignment.start,children:[
    SizedBox(width:105,child:Text(title,style:const TextStyle(
     fontSize:12,color:ceoMuted))),
    Expanded(child:SelectableText(value,style:const TextStyle(
     fontSize:12,color:ceoInk))),
   ]));
 Widget stateTag(String value,{bool positive=false})=>Container(
  padding:const EdgeInsets.symmetric(horizontal:9,vertical:6),
  decoration:BoxDecoration(color:positive?ceoLavender:
   const Color(0xFFF5F3F7),borderRadius:BorderRadius.circular(ceoRadius),
   border:Border.all(color:ceoBorder)),
  child:Text(value,style:TextStyle(fontSize:12,fontWeight:FontWeight.w700,
   color:positive?ceoPurple:ceoInk)));
 Widget resultPanel(CeoP3Url target,CeoP3Audit result)=>Padding(
  key:ValueKey('ceo-p3-result-'+target.key),
  padding:const EdgeInsets.only(top:12),
  child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   Wrap(spacing:7,runSpacing:7,children:[
    stateTag(result.indexedLabel,positive:result.indexed==true),
    stateTag(result.technicalLabel,positive:result.technicalReady),
    if(result.inSitemap==true)stateTag('Có trong sitemap',positive:true)
    else if(result.inSitemap==false)stateTag('Chưa thấy trong sitemap'),
   ]),
   const SizedBox(height:10),
   if(result.coverage!=null)detailLabel('Google ghi nhận',result.coverage!),
   if(result.lastCrawlTime!=null)detailLabel('Google thu thập',
    result.lastCrawlTime!.replaceFirst('T',' ').replaceFirst('.000Z',' UTC')),
   detailLabel('HTTP Website',result.httpStatus?.toString()??'Chưa xác minh'),
   detailLabel('noindex',result.hasNoindex==null?'Chưa xác minh':
    result.hasNoindex!?'Có – cần sửa':'Không phát hiện'),
   if(result.googleCanonical!=null)
    detailLabel('Google canonical',result.googleCanonical!),
   if(result.userCanonical!=null)
    detailLabel('Khai báo canonical',result.userCanonical!),
   const SizedBox(height:5),
   if(result.performanceStatus=='ready')...[
    note('Google Search Analytics · 7/14/30 ngày kết thúc '+
     (result.performanceEnd??'kỳ mới nhất đã chốt')+
     '. Đây là lượt nhấp và hiển thị, KHÔNG phải lịch sử trạng thái index.'),
    const SizedBox(height:7),
    Wrap(spacing:7,runSpacing:7,children:[
     for(final window in result.performance)Container(
      padding:const EdgeInsets.all(10),
      decoration:BoxDecoration(color:ceoLavender.withValues(alpha:.5),
       border:Border.all(color:ceoBorder),borderRadius:BorderRadius.circular(ceoRadius)),
      child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
       Text(window.days.toString()+' ngày',style:const TextStyle(
        fontSize:12,fontWeight:FontWeight.w700,color:ceoPurple)),
       Text(window.clicks.toString()+' nhấp · '+window.impressions.toString()+' hiển thị',
        style:const TextStyle(fontSize:12,color:ceoInk)),
      ]))
    ]),
   ]else note('Chưa lấy được số liệu 7/14/30 ngày từ Google; không suy ra bằng 0.'),
   const SizedBox(height:9),
   Wrap(spacing:7,runSpacing:7,crossAxisAlignment:WrapCrossAlignment.center,children:[
    OutlinedButton.icon(onPressed:()=>openGoogle(result),
     icon:const Icon(Icons.open_in_new,size:17),
     label:const Text('Mở Google Search Console')),
    TextButton.icon(onPressed:()=>unawaited(copyUrl(target)),
     icon:const Icon(Icons.copy,size:16),label:Text(
      copied==target.key?'Đã sao chép URL':'Sao chép URL')),
   ]),
   note('Muốn yêu cầu lập chỉ mục: mở Search Console → Kiểm tra URL '
    '→ dán URL đã sao chép → Yêu cầu lập chỉ mục. '
    'API chỉ đọc phiên bản trong chỉ mục Google, không tự gửi yêu cầu index.'),
  ])
 );
 Widget watchRow(CeoP3Url target){
  final checked=checks[target.key];
  final busy=inspecting==target.key;
  return Container(
   key:ValueKey('ceo-p3-url-'+target.key),
   margin:const EdgeInsets.only(bottom:9),
   padding:const EdgeInsets.all(12),
   decoration:BoxDecoration(color:Colors.white.withValues(alpha:.7),
    border:Border.all(color:ceoBorder),
    borderRadius:BorderRadius.circular(ceoRadius)),
   child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
    Row(crossAxisAlignment:CrossAxisAlignment.start,children:[
     Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
      Text(target.label,style:const TextStyle(
       color:ceoInk,fontSize:13,fontWeight:FontWeight.w700)),
      const SizedBox(height:3),
      SelectableText(target.url,style:const TextStyle(
       color:ceoMuted,fontSize:11.5,height:1.35)),
     ])),
     const SizedBox(width:6),
     OutlinedButton(
      key:ValueKey('ceo-p3-inspect-'+target.key),
      onPressed:inspecting!=null?null:()=>unawaited(inspect(target)),
      child:busy?const SizedBox(width:16,height:16,
       child:CircularProgressIndicator(strokeWidth:2)):
       Text(checked==null?'Kiểm tra':'Kiểm tra lại'),
     ),
    ]),
    if(checked!=null)resultPanel(target,checked)
   ])
  );
 }
 @override Widget build(BuildContext context){
  final value=watchlist;
  if(value==null){
   return Column(key:const ValueKey('ceo-p3-watchlist'),
    crossAxisAlignment:CrossAxisAlignment.stretch,children:[
    if(loading)const LinearProgressIndicator(minHeight:2,color:ceoPurple),
    if(error.isNotEmpty)...[
     note(error),
     const SizedBox(height:8),
     OutlinedButton.icon(onPressed:()=>unawaited(load()),
      icon:const Icon(Icons.refresh,size:17),label:const Text('Tải lại P3'))
    ],
    if(!loading&&error.isEmpty)note('Đang tải danh sách theo dõi...'),
   ]);
  }
  return Column(key:const ValueKey('ceo-p3-watchlist'),
   crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   Row(children:[
    Expanded(child:Text(value.urls.length.toString()+' URL ưu tiên từ báo cáo Google',
     style:const TextStyle(fontSize:13,fontWeight:FontWeight.w700,color:ceoInk))),
    IconButton(tooltip:'Tải lại danh sách P3',onPressed:loading?null:()=>unawaited(load()),
     icon:const Icon(Icons.refresh,color:ceoPurple)),
   ]),
   note(value.note),
   const SizedBox(height:8),
   Wrap(spacing:7,runSpacing:7,children:[
    for(final checkpoint in value.schedule)
     stateTag('Mốc '+checkpoint.days.toString()+' ngày: '+checkpoint.dueDate),
   ]),
   const SizedBox(height:7),
   note('Chỉ kiểm tra Google khi bấm từng URL để tiết kiệm hạn mức API. '
    'Kết quả hiện tại không được coi là lịch sử snapshot đã lưu.'),
   const SizedBox(height:12),
   if(error.isNotEmpty)Padding(padding:const EdgeInsets.only(bottom:10),
    child:Text(error,style:const TextStyle(
     fontSize:12,color:Color(0xFFB45309)))),
   for(final target in value.urls)watchRow(target),
  ]);
 }
}
