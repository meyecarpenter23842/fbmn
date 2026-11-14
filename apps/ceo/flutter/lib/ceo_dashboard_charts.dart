import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'ceo_stats_models.dart';
import 'ceo_ui_tokens.dart';
import 'ceo_workspace.dart';

/// PH03: interactive PostHog series; missing dates remain gaps, never fake zero.
class CeoMarketingTrend extends StatefulWidget{
 final CeoMarketingOverview stats;
 const CeoMarketingTrend({super.key,required this.stats});
 @override State<CeoMarketingTrend> createState()=>_CeoMarketingTrendState();
}
class _TrendPoint{
 final String day;
 final int sessions,leads;
 const _TrendPoint(this.day,this.sessions,this.leads);
}
class _CeoMarketingTrendState extends State<CeoMarketingTrend>{
 String channel='all';
 int selected=-1;
 List<_TrendPoint> get values{
  final grouped=<String,List<int>>{};
  for(final item in widget.stats.daily){
   if(channel!='all'&&item.channel!=channel)continue;
   final counts=grouped.putIfAbsent(item.day,()=>[0,0]);
   counts[0]+=item.sessions;counts[1]+=item.leadSessions;
  }
  final dates=grouped.keys.toList()..sort();
  return [for(final day in dates)_TrendPoint(day,grouped[day]![0],grouped[day]![1])];
 }
 @override Widget build(BuildContext context){
  final points=values;
  final names=<String,String>{'all':'Tất cả nguồn','google_organic':'Google tự nhiên',
   'google_paid':'Google Ads','google_unclassified':'Google chưa phân loại',
   'facebook':'Facebook','zalo':'Zalo','direct':'Trực tiếp','referral':'Giới thiệu','other':'Khác'};
  final channels=widget.stats.channels.map((e)=>e.channel).toSet();
  final options=['all',...names.keys.where(channels.contains)];
  final active=selected>=0&&selected<points.length?selected:points.length-1;
  final p=active>=0?points[active]:null;
  return Column(key:const ValueKey('ceo-ph03-trend-chart'),
   crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   Row(children:[
    const Expanded(child:Text('Xu hướng nguồn khách',
     style:TextStyle(fontSize:13,fontWeight:FontWeight.w700,color:ceoInk))),
    SizedBox(width:170,child:DropdownButtonFormField<String>(
     value:options.contains(channel)?channel:'all',isExpanded:true,
     decoration:const InputDecoration(isDense:true,contentPadding:EdgeInsets.symmetric(horizontal:9,vertical:8),
      border:OutlineInputBorder()),
     items:[for(final ch in options)DropdownMenuItem(value:ch,
      child:Text(names[ch]??ch,overflow:TextOverflow.ellipsis,
       style:const TextStyle(fontSize:12.5)))],
     onChanged:(v){if(v!=null)setState((){channel=v;selected=-1;});},
    ))
   ]),
   const SizedBox(height:10),
   const Wrap(spacing:14,runSpacing:6,children:[
    _LegendDot('Phiên truy cập',ceoPurple),
    _LegendDot('Phiên có yêu cầu',Color(0xFF0B8276))
   ]),
   const SizedBox(height:9),
   if(points.isEmpty)const CeoEmptyResult(title:'Chưa có chuỗi ngày theo nguồn',
    detail:'Chỉ vẽ ngày có phiên được PostHog ghi nhận.',icon:Icons.show_chart)
   else SizedBox(height:208,child:LayoutBuilder(builder:(context,box)=>GestureDetector(
    behavior:HitTestBehavior.opaque,
    onTapDown:(details){
     final first=DateTime.parse(points.first.day);
     final span=math.max(1,DateTime.parse(points.last.day).difference(first).inDays);
     final fraction=((details.localPosition.dx-33)/(box.maxWidth-48)).clamp(0.0,1.0);
     var closest=0;
     var distance=double.infinity;
     for(var i=0;i<points.length;i++){
      final ratio=DateTime.parse(points[i].day).difference(first).inDays/span;
      if((ratio-fraction).abs()<distance){closest=i;distance=(ratio-fraction).abs();}
     }
     setState(()=>selected=closest);
    },
    child:Semantics(label:'Biểu đồ ngày, phiên và phiên tạo yêu cầu',
     child:CustomPaint(size:Size(box.maxWidth,208),painter:_ChannelLines(points,active)))
   ))),
   if(p!=null)Padding(padding:const EdgeInsets.only(top:8),
    child:Text('Ngày ${p.day} · ${p.sessions} phiên · ${p.leads} phiên tạo yêu cầu',
     key:const ValueKey('ceo-ph03-trend-selected'),
     style:const TextStyle(fontSize:12.5,fontWeight:FontWeight.w600,color:ceoInk))),
   const SizedBox(height:6),
   const Text('PostHog · phiên Website theo nguồn first-touch. Chạm biểu đồ xem từng ngày. '
    'Ngày không có bản ghi được để trống, không suy diễn số liệu.',
    style:TextStyle(fontSize:11.5,color:ceoMuted))
  ]);
 }
}
class _LegendDot extends StatelessWidget{
 final String title;final Color color;
 const _LegendDot(this.title,this.color);
 @override Widget build(BuildContext context)=>Row(mainAxisSize:MainAxisSize.min,children:[
  Container(width:9,height:9,decoration:BoxDecoration(color:color,shape:BoxShape.circle)),
  const SizedBox(width:5),Text(title,style:const TextStyle(fontSize:11.5,color:ceoMuted))
 ]);
}
class _ChannelLines extends CustomPainter{
 final List<_TrendPoint> points;final int selected;
 const _ChannelLines(this.points,this.selected);
 @override void paint(Canvas canvas,Size size){
  const left=33.0,top=12.0,bottom=29.0,right=15.0;
  final width=math.max(1.0,size.width-left-right);
  final height=math.max(1.0,size.height-top-bottom);
  final maximum=math.max(1,points.fold<int>(0,(m,p)=>math.max(m,p.sessions)));
  final first=DateTime.parse(points.first.day);
  final span=math.max(1,DateTime.parse(points.last.day).difference(first).inDays);
  double x(int i)=>left+DateTime.parse(points[i].day).difference(first).inDays/span*width;
  double y(int amount)=>top+height*(1-amount/maximum);
  void caption(String label,Offset pos){
   final t=TextPainter(text:TextSpan(text:label,
    style:const TextStyle(fontSize:10,color:ceoMuted)),
    textDirection:TextDirection.ltr)..layout(maxWidth:size.width);
   t.paint(canvas,pos);
  }
  for(var line=0;line<3;line++){
   final yy=top+height*line/2;
   canvas.drawLine(Offset(left,yy),Offset(left+width,yy),
    Paint()..color=ceoBorder..strokeWidth=.8);
   caption((maximum*(2-line)/2).round().toString(),Offset(0,yy-6));
  }
  void drawSeries(int Function(_TrendPoint) amount,Color color){
   final paint=Paint()..color=color..strokeWidth=2.4
    ..style=PaintingStyle.stroke..strokeCap=StrokeCap.round;
   Path? line;
   for(var i=0;i<points.length;i++){
    final position=Offset(x(i),y(amount(points[i])));
    if(i==0||DateTime.parse(points[i].day)
      .difference(DateTime.parse(points[i-1].day)).inDays>1){
     if(line!=null)canvas.drawPath(line,paint);
     line=Path()..moveTo(position.dx,position.dy);
    }else{line!.lineTo(position.dx,position.dy);}
    if(i==selected)canvas.drawCircle(position,4,Paint()..color=color);
   }
   if(line!=null)canvas.drawPath(line,paint);
  }
  drawSeries((p)=>p.sessions,ceoPurple);
  drawSeries((p)=>p.leads,const Color(0xFF0B8276));
  final idx=selected.clamp(0,points.length-1);
  canvas.drawLine(Offset(x(idx),top),Offset(x(idx),top+height),
   Paint()..color=ceoMuted.withValues(alpha:.35)..strokeWidth=1);
  caption(points.first.day.substring(5),Offset(left,size.height-bottom+8));
  if(points.length>1){
   final label=points.last.day.substring(5);
   final tp=TextPainter(text:TextSpan(text:label,
    style:const TextStyle(fontSize:10,color:ceoMuted)),
    textDirection:TextDirection.ltr)..layout();
   tp.paint(canvas,Offset(left+width-tp.width,size.height-bottom+8));
  }
 }
 @override bool shouldRepaint(covariant _ChannelLines old)=>old.points!=points||old.selected!=selected;
}
