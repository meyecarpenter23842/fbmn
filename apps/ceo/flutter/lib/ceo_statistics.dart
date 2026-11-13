import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'ceo_repository.dart';
import 'ceo_stats_models.dart';
import 'ceo_ui_tokens.dart';
import 'ceo_workspace.dart';

class CeoStatisticsTab extends StatefulWidget{
 final CeoRepository api;
 const CeoStatisticsTab({super.key,required this.api});
 @override State<CeoStatisticsTab> createState()=>CeoStatisticsTabState();
}
class CeoStatisticsTabState extends State<CeoStatisticsTab>{
 String period='7d';
 CeoWebStatistics? data;
 bool loading=true;
 String error='';
 int generation=0;
 @override void initState(){
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_){if(mounted)unawaited(load());});
 }
 Future<void> load({String? range})async{
  if(range!=null)period=range;
  final id=++generation;
  setState((){loading=true;error='';});
  try{
   final value=await widget.api.websiteStatistics(period);
   if(mounted&&id==generation)setState((){data=value;loading=false;});
  }catch(_){
   if(mounted&&id==generation)setState((){
    data=null;loading=false;error='Không tải được số liệu PostHog. Kiểm tra kết nối rồi thử lại.';
   });
  }
 }
 @override void dispose(){generation++;super.dispose();}
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
  if(days.isEmpty)return const CeoEmptyResult(title:'Chưa có lượt truy cập',
   detail:'Biểu đồ sẽ xuất hiện khi có sự kiện Website.',icon:Icons.show_chart);
  final maximum=days.fold<int>(0,(a,b)=>math.max(a,b.visits));
  return Column(children:[
   for(final day in days)Padding(padding:const EdgeInsets.symmetric(vertical:6),
    child:Row(children:[
     SizedBox(width:65,child:Text(day.day.length==10?day.day.substring(5):day.day,
      style:const TextStyle(fontSize:12,color:ceoMuted))),
     Expanded(child:LinearProgressIndicator(value:maximum==0?0:day.visits/maximum,
      minHeight:9,color:ceoPurple,backgroundColor:ceoLavender)),
     const SizedBox(width:8),
     SizedBox(width:64,child:Text(day.visits.toString()+' phiên',textAlign:TextAlign.end,
      style:const TextStyle(fontSize:11,fontWeight:FontWeight.w700))),
    ])),
   const Text('Tối đa 14 ngày gần nhất · thời gian UTC',
    style:TextStyle(fontSize:11,color:ceoMuted)),
  ]);
 }
 Widget ranking(List<CeoStatRank> items){
  if(items.isEmpty)return const CeoEmptyResult(title:'Chưa có dữ liệu',
   detail:'Chỉ hiển thị khi có tương tác thực tế.',icon:Icons.insights_outlined);
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
 @override Widget build(BuildContext context){
  final value=data;
  return ListView(physics:const AlwaysScrollableScrollPhysics(),
   padding:const EdgeInsets.only(bottom:24),children:[
   CeoPanel(title:'Thống kê Website',
    subtitle:'PostHog dữ liệu thật · quyền Owner · không thông tin cá nhân',
    icon:Icons.bar_chart_outlined,
    action:IconButton(tooltip:'Tải lại thống kê',onPressed:loading?null:()=>load(),
     icon:const Icon(Icons.refresh)),
    child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
     Wrap(spacing:8,runSpacing:8,children:[
      for(final choice in const [('7d','7 ngày'),('30d','30 ngày'),('90d','90 ngày')])
       ChoiceChip(label:Text(choice.$2),selected:period==choice.$1,
        onSelected:loading?null:(_)=>load(range:choice.$1)),
     ]),
     if(loading)const Padding(padding:EdgeInsets.symmetric(vertical:28),
      child:Center(child:CircularProgressIndicator()))
     else if(error.isNotEmpty)Padding(padding:const EdgeInsets.symmetric(vertical:20),
      child:Column(children:[
       Text(error,textAlign:TextAlign.center,
        style:const TextStyle(fontSize:13,color:Color(0xFFB45309))),
       const SizedBox(height:8),
       OutlinedButton.icon(onPressed:()=>load(),icon:const Icon(Icons.refresh),
        label:const Text('Thử lại')),
      ]))
     else if(value!=null)...[
      const SizedBox(height:12),
      Text('Cập nhật '+value.generatedAt.substring(0,math.min(10,value.generatedAt.length))+
       ' · '+value.timezone,style:const TextStyle(fontSize:11,color:ceoMuted)),
      const SizedBox(height:14),
      summary(value),
      if(!value.hasEvents)const Padding(padding:EdgeInsets.only(top:16),
       child:Text('Chưa phát sinh sự kiện Website trong khoảng thời gian này.',
        style:TextStyle(fontSize:12,color:ceoMuted))),
     ]
    ])),
   if(value!=null&&!loading&&error.isEmpty)...[
    CeoPanel(title:'Xu hướng truy cập',subtitle:'Số phiên theo ngày',
     icon:Icons.show_chart,child:timeline(value)),
    CeoPanel(title:'Nguồn truy cập',subtitle:'Nguồn ghi nhận theo phiên',
     icon:Icons.hub_outlined,child:ranking(value.sources)),
    CeoPanel(title:'Sản phẩm được xem',subtitle:'Sản phẩm có tương tác',
     icon:Icons.inventory_outlined,child:ranking(value.products)),
    CeoPanel(title:'Danh mục được xem',subtitle:'Danh mục có tương tác',
     icon:Icons.category_outlined,child:ranking(value.categories)),
   ],
  ]);
 }
}
