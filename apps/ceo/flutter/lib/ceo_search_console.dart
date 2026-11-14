import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'ceo_gsc_models.dart';
import 'ceo_ui_tokens.dart';
import 'ceo_workspace.dart';

/// SEO06: isolated Google Search Console panel, independent from PostHog statistics.
class CeoGscPanel extends StatelessWidget{
 final CeoGscReport? report;
 final bool loading;
 final String error;
 final VoidCallback retry,onConnect,onDisconnect;
 final bool connectionBusy;
 final String connectionError;
 const CeoGscPanel({super.key,required this.report,required this.loading,
  required this.error,required this.retry,required this.onConnect,
  required this.onDisconnect,this.connectionBusy=false,this.connectionError=''});
 String percent(double n)=> '${(n*100).toStringAsFixed(1)}%';
 Widget kpi(String name,String value,IconData icon,double width)=>SizedBox(
  width:width,child:Container(
   padding:const EdgeInsets.all(12),
   decoration:BoxDecoration(color:ceoLavender.withValues(alpha:.48),
    borderRadius:BorderRadius.circular(11),border:Border.all(color:ceoBorder)),
   child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
    Icon(icon,color:ceoPurple,size:18),
    const SizedBox(height:5),
    Text(value,overflow:TextOverflow.ellipsis,style:const TextStyle(
     fontSize:21,color:ceoInk,fontWeight:FontWeight.w800)),
    Text(name,style:const TextStyle(fontSize:12.5,color:ceoMuted)),
   ])));
 Widget topRows(String title,List<CeoGscRank> items)=>ExpansionTile(
  initiallyExpanded:false,
  title:Text(title,style:const TextStyle(fontSize:13,fontWeight:FontWeight.w700)),
  subtitle:const Text('Bấm để xem tối đa 10 mục · số liệu Google tự nhiên',
   style:TextStyle(fontSize:11,color:ceoMuted)),
  children:items.isEmpty?[
   const CeoEmptyResult(title:'Chưa có dữ liệu',
    detail:'Google chưa trả về hàng dữ liệu phù hợp trong kỳ này.',
    icon:Icons.search_off_outlined),
  ]:[
   for(final item in items)Padding(padding:const EdgeInsets.symmetric(vertical:8,horizontal:10),
    child:Row(crossAxisAlignment:CrossAxisAlignment.start,children:[
     Expanded(child:Text(item.label,maxLines:2,overflow:TextOverflow.ellipsis,
      style:const TextStyle(fontSize:12.5,color:ceoInk))),
     const SizedBox(width:8),
     Column(crossAxisAlignment:CrossAxisAlignment.end,children:[
      Text('${item.metrics.clicks} nhấp',
       style:const TextStyle(fontSize:12.5,color:ceoPurple,fontWeight:FontWeight.w700)),
      Text('${percent(item.metrics.ctr)} · VT ${item.metrics.position.toStringAsFixed(1)}',
       style:const TextStyle(fontSize:11,color:ceoMuted)),
     ]),
    ])),
  ]);
 @override Widget build(BuildContext context){
  if(loading){return const SizedBox(key:ValueKey('ceo-gsc-loading'),height:110,
   child:Center(child:CircularProgressIndicator()));}
  if(error.isNotEmpty){return Column(key:const ValueKey('ceo-gsc-error'),children:[
   Text(error,textAlign:TextAlign.center,style:const TextStyle(
    fontSize:13,color:Color(0xFFB45309))),
   const SizedBox(height:12),
   OutlinedButton.icon(onPressed:retry,icon:const Icon(Icons.refresh),
    label:const Text('Thử tải lại Search Console')),
  ]);}
  final value=report;
  if(value==null||!value.configured){return Column(
   key:const ValueKey('ceo-gsc-unconfigured'),children:[
   const CeoEmptyResult(
    title:'Chưa kết nối Google Search Console',
    detail:'Kết nối tài khoản Google có quyền xem property fbmn.vn. Không cần tạo file JSON.',
    icon:Icons.link_off_outlined),
   if(value?.oauthStatus=='disconnected')...[
    const SizedBox(height:12),
    FilledButton.icon(key:const ValueKey('gsc-connect-google'),
     onPressed:connectionBusy?null:onConnect,
     icon:const Icon(Icons.link),label:const Text('Kết nối Google')),
   ],
   if(value?.oauthStatus!='disconnected')const Padding(
    padding:EdgeInsets.only(top:8),
    child:Text('Chưa cấu hình Google OAuth Client ID/Secret trên CEO.',
     style:TextStyle(fontSize:12,color:ceoMuted))),
   if(connectionError.isNotEmpty)Text(connectionError,
    style:const TextStyle(fontSize:12,color:Color(0xFFB45309))),
  ]);}
  final m=value.metrics;
  if(m==null){return Column(children:[
   CeoEmptyResult(
    key:const ValueKey('ceo-gsc-empty'),
    title:'Chưa có dữ liệu tìm kiếm Google',
    detail:'Google chưa trả về số liệu hoàn tất trong kỳ ${value.startDate} đến ${value.endDate}.',
    icon:Icons.search_off_outlined),
   OutlinedButton.icon(key:const ValueKey('gsc-disconnect-google'),
    onPressed:connectionBusy?null:onDisconnect,
    icon:const Icon(Icons.link_off),label:const Text('Ngắt kết nối Google')),
  ]);}
  final dates=value.daily.length>7?value.daily.sublist(value.daily.length-7):value.daily;
  final maxClicks=dates.fold<int>(1,(n,d)=>math.max(n,d.metrics.clicks));
  return Column(key:const ValueKey('ceo-gsc-ready'),
   crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   Text('Google Search Console · www.fbmn.vn · ${value.startDate} — ${value.endDate}',
    style:const TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:5),
   const Text('Ngày theo giờ Thái Bình Dương (PT), kết thúc trước 3 ngày để tránh số liệu chưa hoàn tất.',
    style:TextStyle(fontSize:11.5,color:ceoMuted)),
   const SizedBox(height:12),
   LayoutBuilder(builder:(context,box){
    final columns=box.maxWidth>=630?4:2;
    final w=math.max(120.0,(box.maxWidth-(columns-1)*8)/columns);
    return Wrap(spacing:8,runSpacing:8,children:[
     kpi('Lượt nhấp',m.clicks.toString(),Icons.ads_click_outlined,w),
     kpi('Hiển thị',m.impressions.toString(),Icons.visibility_outlined,w),
     kpi('CTR',percent(m.ctr),Icons.percent_outlined,w),
     kpi('Vị trí TB',m.position.toStringAsFixed(1),Icons.trending_up_outlined,w),
    ]);
   }),
   if(dates.isNotEmpty)...[
    const SizedBox(height:16),
    const Text('Lượt nhấp 7 ngày gần nhất có dữ liệu',
     style:TextStyle(fontSize:13,fontWeight:FontWeight.w700,color:ceoInk)),
    const SizedBox(height:7),
    for(final day in dates)Padding(padding:const EdgeInsets.only(bottom:6),
     child:Row(children:[
      SizedBox(width:57,child:Text(day.date.substring(5),
       style:const TextStyle(fontSize:11.5,color:ceoMuted))),
      Expanded(child:LinearProgressIndicator(value:day.metrics.clicks/maxClicks,
       minHeight:8,color:ceoPurple,backgroundColor:ceoLavender)),
      const SizedBox(width:8),
      SizedBox(width:53,child:Text('${day.metrics.clicks} nhấp',
       textAlign:TextAlign.end,style:const TextStyle(fontSize:10.5,color:ceoInk))),
     ])),
   ],
   const SizedBox(height:8),
   topRows('Top từ khóa tìm kiếm (${value.queries.length})',value.queries),
   topRows('Top trang xuất hiện trên Google (${value.pages.length})',value.pages),
   const SizedBox(height:12),
   Align(alignment:Alignment.centerRight,child:OutlinedButton.icon(
    key:const ValueKey('gsc-disconnect-google'),
    onPressed:connectionBusy?null:onDisconnect,
    icon:const Icon(Icons.link_off),label:const Text('Ngắt kết nối Google'))),
   const SizedBox(height:10),
   const Text('GSC đo lượt nhấp/hiển thị từ Google tự nhiên; PostHog đo phiên và yêu cầu B2B. Hai nguồn không được cộng chung. Vị trí trung bình càng thấp càng tốt.',
    style:TextStyle(fontSize:11.5,color:ceoMuted)),
  ]);
 }
}
