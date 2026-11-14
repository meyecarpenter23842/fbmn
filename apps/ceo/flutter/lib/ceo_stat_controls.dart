import 'package:flutter/material.dart';
import 'ceo_ui_tokens.dart';

/// Compact 7/30/90-day segment for CEO statistics, sized from shared UI tokens.
class CeoStatsPeriodFilter extends StatelessWidget {
 final String period;
 final bool enabled,mobile;
 final ValueChanged<String> onChanged;
 const CeoStatsPeriodFilter({super.key,required this.period,
  required this.onChanged,required this.mobile,this.enabled=true});
 @override Widget build(BuildContext context){
  final height=mobile?ceoMobileButtonHeight:ceoDesktopButtonHeight;
  return Material(color:Colors.transparent,child:Container(
   key:const ValueKey('ceo-stats-period-filter'),
   padding:const EdgeInsets.all(2),
   decoration:BoxDecoration(color:const Color(0xFFF8F5FB),
    border:Border.all(color:ceoBorder),borderRadius:BorderRadius.circular(ceoRadius)),
   child:Row(mainAxisSize:MainAxisSize.min,children:[
    for(final item in const [('7d','7N','7 ngày'),('30d','30N','30 ngày'),('90d','90N','90 ngày')])
     Semantics(selected:period==item.$1,button:true,label:item.$3,
      child:Tooltip(message:item.$3,child:InkWell(key:ValueKey('ceo-stats-period-${item.$1}'),
       borderRadius:BorderRadius.circular(ceoRadius-1),
       onTap:enabled&&period!=item.$1?()=>onChanged(item.$1):null,
       child:AnimatedContainer(duration:ceoMotion,curve:Curves.easeOutCubic,
        height:height,
        padding:EdgeInsets.symmetric(horizontal:mobile?7:10),
        decoration:BoxDecoration(
         color:period==item.$1?ceoLavender:Colors.transparent,
         borderRadius:BorderRadius.circular(ceoRadius-1),
         border:Border.all(color:period==item.$1?ceoBorder:Colors.transparent)),
        child:Center(child:Text(mobile?item.$2:item.$3,style:TextStyle(
         fontSize:ceoControlFontSize,fontWeight:period==item.$1?
          FontWeight.w700:FontWeight.w500,
         color:period==item.$1?ceoPurple:ceoMuted)))))))
   ])));
 }
}

/// Secondary navigation uses an active underline, not five ChoiceChip buttons.
/// On narrow screens the tab rail scrolls independently of the CEO page.
class CeoStatsSubTabs extends StatelessWidget {
 final List<String> tabs;
 final int selected;
 final bool mobile;
 final ValueChanged<int> onChanged;
 const CeoStatsSubTabs({super.key,required this.tabs,required this.selected,
  required this.onChanged,required this.mobile});
 @override Widget build(BuildContext context){
  final height=mobile?ceoMobileButtonHeight:ceoDesktopButtonHeight;
  return Container(
   decoration:const BoxDecoration(border:Border(
    bottom:BorderSide(color:ceoBorder))),
   child:SingleChildScrollView(key:const ValueKey('ceo-stats-subtabs'),
    scrollDirection:Axis.horizontal,
    child:Row(children:[
     for(var i=0;i<tabs.length;i++)
      Semantics(selected:selected==i,button:true,
       child:Material(color:Colors.transparent,
        child:InkWell(
         key:ValueKey('ceo-stats-tab-$i'),
         onTap:selected==i?null:()=>onChanged(i),
         child:AnimatedContainer(duration:ceoMotion,curve:Curves.easeOutCubic,
          height:height,padding:const EdgeInsets.symmetric(horizontal:14),
          decoration:BoxDecoration(
           color:selected==i?ceoLavender:Colors.transparent,
           border:Border(bottom:BorderSide(
            color:selected==i?ceoPurple:Colors.transparent,width:2.5))),
          child:Center(child:Text(tabs[i],style:TextStyle(
           fontSize:ceoControlFontSize,
           color:selected==i?ceoPurple:ceoMuted,
           fontWeight:selected==i?FontWeight.w700:FontWeight.w500)))))))
    ])));
 }
}

 
/// Pins the secondary tab rail only when it reaches the top of Statistics.
/// The preceding 7/30/90 filter is deliberately not pinned.
class CeoStatsStickyHeader extends SliverPersistentHeaderDelegate {
 final Widget child;
 final double height;
 const CeoStatsStickyHeader({required this.child,required this.height});
 @override double get minExtent=>height;
 @override double get maxExtent=>height;
 @override Widget build(BuildContext context,double shrinkOffset,bool overlapsContent)=>
  Material(color:Colors.white,elevation:overlapsContent?2:0,
   shadowColor:ceoPurple.withValues(alpha:.14),
   child:SizedBox(height:height,child:child));
 @override bool shouldRebuild(covariant CeoStatsStickyHeader oldDelegate)=>
  oldDelegate.height!=height||oldDelegate.child!=child;
}
