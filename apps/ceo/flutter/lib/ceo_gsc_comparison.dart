import 'package:flutter/material.dart';
import 'ceo_gsc_models.dart';
import 'ceo_ui_tokens.dart';

/// SEO07: compare equal finalized Google windows; top-list absence is not zero traffic.
class CeoGscComparisonPanel extends StatelessWidget {
 final CeoGscComparison comparison;
 final String period;
 const CeoGscComparisonPanel({super.key,required this.comparison,required this.period});

 String signed(num n,{int decimals=0})=>
  '${n>0?"+":""}${n.toStringAsFixed(decimals)}';

 Widget deltaChip(String label,String value,{bool good=true})=>Container(
  padding:const EdgeInsets.symmetric(horizontal:10,vertical:8),
  decoration:BoxDecoration(color:ceoLavender.withValues(alpha:.52),
   border:Border.all(color:ceoBorder),borderRadius:BorderRadius.circular(ceoRadius)),
  child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
   Text(label,style:const TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:3),
   Text(value,style:TextStyle(fontSize:14,fontWeight:FontWeight.w700,
    color:good?ceoPurple:const Color(0xFFA74827)))
  ]));

 Widget movementRow(CeoGscMovement value)=>Padding(
  padding:const EdgeInsets.symmetric(vertical:7,horizontal:10),
  child:Row(crossAxisAlignment:CrossAxisAlignment.start,children:[
   Expanded(child:Text(value.label,maxLines:2,overflow:TextOverflow.ellipsis,
    style:const TextStyle(fontSize:12.5,color:ceoInk))),
   const SizedBox(width:7),
   Column(crossAxisAlignment:CrossAxisAlignment.end,children:[
    Text(value.clickDelta==null?
     (value.status=='new'?'Mới trong top 10':'Ra khỏi top 10'):
     '${signed(value.clickDelta!)} nhấp',
     style:TextStyle(fontSize:12.5,fontWeight:FontWeight.w700,
      color:value.status=='down'?const Color(0xFFA74827):ceoPurple)),
    if(value.positionImprovement!=null)
     Text('Vị trí ${signed(value.positionImprovement!,decimals:1)}',
      style:const TextStyle(fontSize:11,color:ceoMuted))
   ])
  ]));

 Widget changes(String title,CeoGscMovementGroup rows)=>ExpansionTile(
  initiallyExpanded:true,
  tilePadding:const EdgeInsets.symmetric(horizontal:4),
  title:Text(title,style:const TextStyle(fontSize:13,fontWeight:FontWeight.w700,color:ceoInk)),
  children:[
   for(final group in [
    (label:'Tăng lượt nhấp',items:rows.gainers),
    (label:'Giảm lượt nhấp',items:rows.decliners),
    (label:'Mới trong top 10',items:rows.newInTop),
    (label:'Không còn trong top 10',items:rows.leftTop)
   ])if(group.items.isNotEmpty)...[
    Padding(padding:const EdgeInsets.fromLTRB(8,8,8,4),
     child:Align(alignment:Alignment.centerLeft,child:Text(group.label,
      style:const TextStyle(fontSize:12,fontWeight:FontWeight.w700,color:ceoMuted)))),
    for(final item in group.items)movementRow(item)
   ],
   if(rows.gainers.isEmpty&&rows.decliners.isEmpty&&
      rows.newInTop.isEmpty&&rows.leftTop.isEmpty)
    const Padding(padding:EdgeInsets.all(12),
     child:Text('Chưa có biến động đủ dữ liệu để so sánh.',
      style:TextStyle(fontSize:12,color:ceoMuted)))
  ]);

 @override Widget build(BuildContext context){
  final d=comparison.totals;
  final periodLabel=switch(period){'30d'=>'30 ngày','90d'=>'90 ngày',_=>'7 ngày'};
  return Column(key:const ValueKey('ceo-seo07-comparison'),
   crossAxisAlignment:CrossAxisAlignment.start,children:[
   const SizedBox(height:15),
   const Divider(color:ceoBorder),
   const SizedBox(height:8),
   Text('SEO07 · So sánh $periodLabel với kỳ trước',
    style:const TextStyle(fontSize:14,color:ceoInk,fontWeight:FontWeight.w800)),
   const SizedBox(height:4),
   Text('Kỳ trước: ${comparison.startDate} – ${comparison.endDate} (PT)',
    style:const TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:9),
   if(d==null)
    const Text('Google chưa trả đủ số liệu cả hai kỳ để kết luận tăng/giảm.',
     key:ValueKey('ceo-seo07-insufficient'),
     style:TextStyle(fontSize:12,color:ceoMuted))
   else Wrap(spacing:8,runSpacing:8,children:[
    deltaChip('Lượt nhấp',signed(d.clicksDelta),good:d.clicksDelta>=0),
    deltaChip('Hiển thị',signed(d.impressionsDelta),good:d.impressionsDelta>=0),
    deltaChip('CTR (điểm %)',signed(d.ctrPointsDelta,decimals:2),
     good:d.ctrPointsDelta>=0),
    deltaChip('Cải thiện vị trí',signed(d.positionImprovement,decimals:1),
     good:d.positionImprovement>=0)
   ]),
   const SizedBox(height:8),
   changes('Từ khóa tăng / giảm',comparison.keywords),
   changes('Trang tăng / giảm',comparison.pages),
   const Text('Chỉ tính chênh lệch khi mục có mặt trong top 10 cả hai kỳ. '
    'Mục mới hoặc không còn trong danh sách không có nghĩa lưu lượng bằng 0. '
    'Cải thiện vị trí dương nghĩa thứ hạng tốt hơn.',
    style:TextStyle(fontSize:11.5,color:ceoMuted)),
   const SizedBox(height:9)
  ]);
 }
}
