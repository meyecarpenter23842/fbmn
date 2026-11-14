import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'ceo_repository.dart';
import 'ceo_stats_models.dart';
import 'ceo_marketing.dart';
import 'ceo_gsc_models.dart';
import 'ceo_search_console.dart';
import 'gsc_oauth_navigation_stub.dart' if (dart.library.js_interop) 'gsc_oauth_navigation_web.dart' as oauth_nav;
import 'ceo_ui_tokens.dart';
import 'ceo_workspace.dart';

class CeoStatisticsTab extends StatefulWidget{
 final CeoRepository api;
 const CeoStatisticsTab({super.key,required this.api});
 @override State<CeoStatisticsTab> createState()=>CeoStatisticsTabState();
}
class CeoStatisticsTabState extends State<CeoStatisticsTab>{
 String period='7d';
 int section=0;
 bool oauthBusy=false;
 String oauthError='';
 bool oauthReconnectRequired=false;
 CeoGscReport? gsc;
 bool gscLoading=false;
 String gscError='';
 String gscPeriod='';
 int gscGeneration=0;
 CeoWebStatistics? data;
 bool loading=true;
 String error='';
 int generation=0;
 @override void initState(){
  super.initState();
  if(Uri.base.queryParameters['gsc']!=null)section=4;
  WidgetsBinding.instance.addPostFrameCallback((_){
   if(!mounted)return;
   unawaited(load());
   if(section==4)unawaited(loadGsc(fresh:true));
  });
 }
 Future<void> load({String? range,bool fresh=false})async{
  if(range!=null)period=range;
  final id=++generation;
  setState((){loading=true;error='';});
  if(section==4&&(range!=null||fresh))unawaited(loadGsc(fresh:true));
  try{
   final value=await widget.api.websiteStatistics(period,fresh:fresh);
   if(mounted&&id==generation)setState((){data=value;loading=false;});
  }catch(_){
   if(mounted&&id==generation){setState((){
    data=null;loading=false;error='Không tải được số liệu PostHog. Kiểm tra kết nối rồi thử lại.';
   });}
  }
 }
 Future<void> loadGsc({bool fresh=false})async{
  final requested=period;
  if(!fresh&&gscPeriod==requested&&(gscLoading||gsc!=null))return;
  final id=++gscGeneration;
  setState((){gscLoading=true;gscError='';gsc=null;gscPeriod=requested;oauthReconnectRequired=false;});
  try{
   final value=await widget.api.searchConsole(requested,fresh:fresh);
   if(mounted&&id==gscGeneration){setState((){gsc=value;gscLoading=false;});}
  }on CeoApiException catch(e){
   if(mounted&&id==gscGeneration){
    setState((){
     gsc=null;gscLoading=false;oauthReconnectRequired=e.status==409;
     gscError=e.status==409?
      'Quyền Google đã hết hạn hoặc bị thu hồi. Vui lòng kết nối lại Google.':
      'Không tải được dữ liệu Google Search Console. Kiểm tra kết nối hoặc quyền property rồi thử lại.';
    });
   }
  }catch(_){
   if(mounted&&id==gscGeneration){
    setState((){
     gsc=null;gscLoading=false;
     gscError='Không tải được dữ liệu Google Search Console. Kiểm tra kết nối rồi thử lại.';
    });
   }
  }
 }
 Future<void> connectGoogle()async{
  if(oauthBusy){return;}
  setState((){oauthBusy=true;oauthError='';});
  try{
   final url=await widget.api.startGscOAuth();
   if(!mounted){return;}
   oauth_nav.navigateGoogleConsent(url);
  }catch(_){
   if(mounted){setState((){
    oauthBusy=false;
    oauthError='Không thể mở kết nối Google. Kiểm tra cấu hình OAuth rồi thử lại.';
   });}
  }
 }
 Future<void> disconnectGoogle()async{
  if(oauthBusy){return;}
  final ok=await showDialog<bool>(context:context,builder:(context)=>AlertDialog(
   title:const Text('Ngắt kết nối Google?'),
   content:const Text('CEO sẽ ngừng đọc dữ liệu Search Console cho tài khoản này. Các thống kê PostHog không bị ảnh hưởng.'),
   actions:[
    TextButton(onPressed:()=>Navigator.of(context).pop(false),child:const Text('Hủy')),
    FilledButton(onPressed:()=>Navigator.of(context).pop(true),child:const Text('Ngắt kết nối')),
   ]));
  if(ok!=true||!mounted){return;}
  setState((){oauthBusy=true;oauthError='';});
  try{
   await widget.api.disconnectGscOAuth();
   if(mounted){
    setState(()=>oauthBusy=false);
    unawaited(loadGsc(fresh:true));
   }
  }catch(_){
   if(mounted){setState((){
    oauthBusy=false;
    oauthError='Không thể ngắt kết nối. Vui lòng thử lại.';
   });}
  }
 }
 @override void dispose(){generation++;gscGeneration++;super.dispose();}
 Widget summary(CeoWebStatistics value)=>LayoutBuilder(builder:(context,box){
  final columns=box.maxWidth>=720?4:2;
  final cardWidth=math.max(130.0,(box.maxWidth-(columns-1)*10)/columns);
  final cards=<({String key,String name,IconData icon})>[
   (key:'visits',name:'Phiên truy cập',icon:Icons.people_outline),
   (key:'pageViews',name:'Lượt xem trang',icon:Icons.visibility_outlined),
   (key:'productViews',name:'Xem sản phẩm',icon:Icons.inventory_2_outlined),
   (key:'catalogueViews',name:'Xem catalogue',icon:Icons.menu_book_outlined),
   (key:'pdfDownloads',name:'Tải PDF thành công',icon:Icons.download_outlined),
   (key:'chatOpens',name:'Mở chatbot',icon:Icons.chat_bubble_outline),
   (key:'contacts',name:'Gửi liên hệ thành công',icon:Icons.contact_mail_outlined),
   (key:'outsourcing',name:'Gửi yêu cầu gia công',icon:Icons.handyman_outlined),
  ];
  return Wrap(spacing:10,runSpacing:10,children:[
   for(final item in cards)SizedBox(width:cardWidth,
    child:CeoMetricCard(label:item.name,count:value.metric(item.key),icon:item.icon))
  ]);
 });
 Widget timeline(CeoWebStatistics value){
  final days=value.daily.length>14?value.daily.sublist(value.daily.length-14):value.daily;
  if(days.isEmpty){return const CeoEmptyResult(title:'Chưa có lượt truy cập',
   detail:'Biểu đồ sẽ xuất hiện khi có sự kiện Website.',icon:Icons.show_chart);}
  final maximum=days.fold<int>(0,(a,b)=>math.max(a,b.visits));
  return Column(children:[
   for(final day in days)Padding(padding:const EdgeInsets.symmetric(vertical:6),
    child:Row(children:[
     SizedBox(width:65,child:Text(day.day.length==10?day.day.substring(5):day.day,
      style:const TextStyle(fontSize:12,color:ceoMuted))),
     Expanded(child:LinearProgressIndicator(value:maximum==0?0:day.visits/maximum,
      minHeight:9,color:ceoPurple,backgroundColor:ceoLavender)),
     const SizedBox(width:8),
     SizedBox(width:64,child:Text('${day.visits} phiên',textAlign:TextAlign.end,
      style:const TextStyle(fontSize:11,fontWeight:FontWeight.w700))),
    ])),
   const Text('Tối đa 14 ngày gần nhất · thời gian UTC',
    style:TextStyle(fontSize:11,color:ceoMuted)),
  ]);
 }
 Widget seoPanel(CeoWebStatistics value){
  final seo=value.seo;
  final rate=seo.leadRatePercent;
  final cards=<({String name,int value,IconData icon})>[
   (name:'Phiên từ Google tự nhiên',value:seo.organicSessions,icon:Icons.search),
   (name:'Phiên xem sản phẩm',value:seo.organicProductSessions,icon:Icons.inventory_2_outlined),
   (name:'Phiên gửi liên hệ',value:seo.organicContactSessions,icon:Icons.contact_mail_outlined),
   (name:'Phiên gửi gia công',value:seo.organicOutsourcingSessions,icon:Icons.handyman_outlined),
   (name:'Phiên có yêu cầu thành công',value:seo.organicLeadSessions,icon:Icons.verified_outlined),
   (name:'Lượt bấm CTA',value:seo.organicCtaClicks,icon:Icons.ads_click_outlined),
  ];
  return Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   const Text('Phân loại theo nguồn truy cập đầu phiên. Không tính quảng cáo Google vào Organic.',
    style:TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:10),
   LayoutBuilder(builder:(context,box){
    final columns=box.maxWidth>=720?3:2;
    final width=math.max(124.0,(box.maxWidth-(columns-1)*10)/columns);
    return Wrap(spacing:10,runSpacing:10,children:[
     for(final item in cards)SizedBox(width:width,
      child:CeoMetricCard(label:item.name,count:item.value,icon:item.icon))
    ]);
   }),
   const SizedBox(height:12),
   Text(rate==null?'Tỷ lệ phiên gửi yêu cầu: chưa có phiên Organic':
    'Tỷ lệ phiên gửi yêu cầu: ${rate.toStringAsFixed(1)}%',
    style:const TextStyle(fontSize:13,fontWeight:FontWeight.w700,color:ceoPurple)),
   Text('Google Ads: ${seo.googlePaidSessions} phiên · Google chưa phân loại: ${seo.googleUnclassifiedSessions} phiên',
    style:const TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:10),
   const Text('Số phiên Organic và chuyển đổi chỉ tính từ lúc SEO05 có dữ liệu phân kênh. Không phải số lượt nhấp, hiển thị, CTR hay thứ hạng của Google Search Console.',
    style:TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:12),
   const Text('Trang được xem từ Google tự nhiên',style:TextStyle(
    fontWeight:FontWeight.w700,fontSize:13,color:ceoInk)),
   const SizedBox(height:6),
   ranking(value.seoPages),
   const SizedBox(height:10),
   const Text('Bảng này sử dụng PostHog, khác dữ liệu Google Search Console ở thẻ SEO06 phía trên.',
    style:TextStyle(fontSize:12,color:ceoMuted)),
  ]);
 }
 Widget funnelPanel(CeoWebStatistics value){
  final f=value.funnel;
  final steps=<({String label,int count})>[
   (label:'1. Xem sản phẩm',count:f.viewedSessions),
   (label:'2. Bấm nút liên hệ',count:f.ctaSessions),
   (label:'3. Gửi yêu cầu thành công',count:f.submittedSessions),
  ];
  String pct(double? value)=>value==null?'—':'${value.toStringAsFixed(1)}%';
  if(f.viewedSessions==0){
   return const CeoEmptyResult(title:'Chưa có phiên xem sản phẩm',
    detail:'Chưa thể tính chuyển đổi trong khoảng thời gian đã chọn.',
    icon:Icons.filter_alt_outlined);
  }
  return Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   const Text('Mỗi phiên chỉ tính một lần ở từng bước; hành động phải đúng thứ tự trong cùng phiên, tối đa 24 giờ.',
    style:TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:12),
   for(final step in steps)Padding(padding:const EdgeInsets.only(bottom:14),
    child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
     Row(children:[
      Expanded(child:Text(step.label,style:const TextStyle(fontSize:13,fontWeight:FontWeight.w600,color:ceoInk))),
      const SizedBox(width:8),
      Text('${step.count} phiên',style:const TextStyle(fontSize:13,fontWeight:FontWeight.w700,color:ceoPurple)),
     ]),
     const SizedBox(height:6),
     LinearProgressIndicator(value:step.count/f.viewedSessions,
      minHeight:9,color:ceoPurple,backgroundColor:ceoLavender),
    ])),
   Text('Xem → Bấm: ${pct(f.viewToCtaPercent)}    ·    Bấm → Gửi: ${pct(f.ctaToSubmitPercent)}',
    style:const TextStyle(fontSize:12,color:ceoInk)),
   const SizedBox(height:6),
   Text('Chuyển đổi tổng: ${pct(f.overallPercent)}',
    style:const TextStyle(fontSize:14,fontWeight:FontWeight.w700,color:ceoPurple)),
   const SizedBox(height:8),
   Text('Chưa bấm CTA: ${f.notClicked} phiên · Đã bấm nhưng chưa gửi: ${f.notSubmitted} phiên',
    style:const TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:8),
   const Text('CTA chỉ là ý định liên hệ; chỉ xác nhận HTTP 201 mới tính yêu cầu thành công. Dữ liệu trước khi Website bật sự kiện CTA không được hồi tố.',
    style:TextStyle(fontSize:12,color:ceoMuted)),
  ]);
 }
 Widget ranking(List<CeoStatRank> items){
  if(items.isEmpty){return const CeoEmptyResult(title:'Chưa có dữ liệu',
   detail:'Chỉ hiển thị khi có tương tác thực tế.',icon:Icons.insights_outlined);}
  return Column(children:[
   for(final item in items)Padding(padding:const EdgeInsets.symmetric(vertical:7),
    child:Row(children:[
     Expanded(child:Text(item.label,overflow:TextOverflow.ellipsis,
      style:const TextStyle(fontSize:13,color:ceoInk))),
     Text(item.count.toString(),style:const TextStyle(
      fontSize:13,fontWeight:FontWeight.w700,color:ceoPurple)),
    ])),
  ]);
 }
 Widget sectionPicker(){
  const tabs=['Tổng quan','Chuyển đổi','Marketing','Sản phẩm','SEO'];
  final mobile=MediaQuery.sizeOf(context).width<=780;
  return SingleChildScrollView(key:const ValueKey('ceo-stats-subtabs'),
   scrollDirection:Axis.horizontal,child:Row(children:[
    for(var i=0;i<tabs.length;i++)Padding(padding:EdgeInsets.only(right:i==tabs.length-1?0:8),
     child:ConstrainedBox(constraints:BoxConstraints(minHeight:mobile?44:36),
      child:ChoiceChip(key:ValueKey('ceo-stats-tab-$i'),
       label:Text(tabs[i]),labelStyle:const TextStyle(fontSize:13),
       selected:section==i,
       onSelected:(_){
        if(section==i)return;
        setState(()=>section=i);
        if(i==4)unawaited(loadGsc());
       }))),
   ]));
 }
 List<Widget> selectedPanels(CeoWebStatistics value)=>switch(section){
  1=>[
   CeoPanel(title:'PH01 · Funnel B2B',
    subtitle:'Xem sản phẩm → Liên hệ → Yêu cầu thành công',
    icon:Icons.filter_alt_outlined,child:funnelPanel(value)),
  ],
  2=>[CeoMarketingPanel(stats:value.marketing)],
  3=>[
   CeoPanel(title:'Sản phẩm được xem',
    subtitle:value.labelsUnavailable?'Không lấy được tên · đang hiển thị mã gốc':
      'Tên sản phẩm theo danh mục đang công khai',
    icon:Icons.inventory_outlined,child:ranking(value.products)),
   CeoPanel(title:'Danh mục được xem',
    subtitle:value.labelsUnavailable?'Không lấy được tên · đang hiển thị mã gốc':
      'Tên danh mục theo dữ liệu đang công khai',
    icon:Icons.category_outlined,child:ranking(value.categories)),
  ],
  4=>[
   CeoPanel(title:'SEO · Google tự nhiên',
    subtitle:'Nguồn truy cập và chuyển đổi đo bằng PostHog',
    icon:Icons.travel_explore_outlined,child:seoPanel(value)),
  ],
  _=>[
   CeoPanel(title:'Tổng quan Website',subtitle:'Chỉ số thật theo kỳ đã chọn',
    icon:Icons.dashboard_outlined,child:Column(
     crossAxisAlignment:CrossAxisAlignment.stretch,children:[
      summary(value),
      if(!value.hasEvents)const Padding(padding:EdgeInsets.only(top:16),
       child:Text('Chưa phát sinh sự kiện Website trong khoảng thời gian này.',
        style:TextStyle(fontSize:12,color:ceoMuted))),
     ])),
   CeoPanel(title:'Xu hướng truy cập',subtitle:'Số phiên theo ngày',
    icon:Icons.show_chart,child:timeline(value)),
   CeoPanel(title:'Nguồn truy cập',subtitle:'Nguồn ghi nhận theo phiên (dữ liệu gốc)',
    icon:Icons.hub_outlined,child:ranking(value.sources)),
  ],
 };
 @override Widget build(BuildContext context){
  final value=data;
  return ListView(physics:const AlwaysScrollableScrollPhysics(),
   padding:const EdgeInsets.only(bottom:24),children:[
   CeoPanel(title:'Thống kê Website',
    subtitle:'PostHog dữ liệu thật · quyền Owner · không thông tin cá nhân',
    icon:Icons.bar_chart_outlined,
    action:IconButton(tooltip:'Tải lại thống kê',onPressed:loading?null:()=>load(fresh:true),
     icon:const Icon(Icons.refresh)),
    child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
     Wrap(spacing:8,runSpacing:8,children:[
      for(final choice in const [('7d','7 ngày'),('30d','30 ngày'),('90d','90 ngày')])
       ChoiceChip(label:Text(choice.$2),selected:period==choice.$1,
        onSelected:loading?null:(_)=>load(range:choice.$1,fresh:true)),
     ]),
     const SizedBox(height:12),
     sectionPicker(),
     if(loading)const Padding(padding:EdgeInsets.symmetric(vertical:28),
      child:Center(child:CircularProgressIndicator()))
     else if(error.isNotEmpty)Padding(padding:const EdgeInsets.symmetric(vertical:20),
      child:Column(children:[
       Text(error,textAlign:TextAlign.center,
        style:const TextStyle(fontSize:13,color:Color(0xFFB45309))),
       const SizedBox(height:8),
       OutlinedButton.icon(onPressed:()=>load(fresh:true),icon:const Icon(Icons.refresh),
        label:const Text('Thử lại')),
      ]))
     else if(value!=null)...[
      const SizedBox(height:12),
      Text(value.generatedAt.isEmpty?'Đã tải dữ liệu từ PostHog · ${value.timezone}':
       'PostHog tính dữ liệu lúc ${value.generatedAt.substring(0,math.min(16,value.generatedAt.length))} · ${value.timezone}',
       style:const TextStyle(fontSize:11,color:ceoMuted)),
      if(value.cached)const Padding(padding:EdgeInsets.only(top:5),
       child:Text('Đang hiển thị kết quả đã lưu tạm từ PostHog.',
        style:TextStyle(fontSize:11,color:ceoMuted))),
     ],
    ])),
   if(section==4)CeoPanel(
    title:'SEO06 · Google Search Console',
    subtitle:'Google tự nhiên · lượt nhấp, hiển thị, CTR và vị trí trung bình',
    icon:Icons.travel_explore_outlined,
    child:CeoGscPanel(report:gsc,loading:gscLoading,error:gscError,
     reconnectRequired:oauthReconnectRequired,
     connectionBusy:oauthBusy,connectionError:oauthError,
     onConnect:()=>unawaited(connectGoogle()),
     onDisconnect:()=>unawaited(disconnectGoogle()),
     retry:()=>unawaited(loadGsc(fresh:true)))),
   if(value!=null&&!loading&&error.isEmpty)...selectedPanels(value),
  ]);
 }
}
