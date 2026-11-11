import 'package:flutter/material.dart';
import 'ceo_ui_tokens.dart';

/// Shared CEO surfaces. Mobile content must never request a fixed page width.
class CeoPanel extends StatelessWidget {
 final String title, subtitle;
 final IconData icon;
 final Widget child;
 final Widget? action;
 const CeoPanel({super.key,required this.title,required this.subtitle,
  required this.icon,required this.child,this.action});

 @override Widget build(BuildContext context)=>Card(
  margin:const EdgeInsets.fromLTRB(12,9,12,3),
  clipBehavior:Clip.antiAlias,
  child:Padding(padding:EdgeInsets.all(MediaQuery.sizeOf(context).width<500?14:20),
   child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
    Row(crossAxisAlignment:CrossAxisAlignment.center,children:[
     Container(width:38,height:38,
      decoration:BoxDecoration(color:ceoLavender,borderRadius:BorderRadius.circular(11)),
      child:Icon(icon,color:ceoPurple,size:20)),
     const SizedBox(width:12),
     Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
      Text(title,maxLines:2,overflow:TextOverflow.ellipsis,
       style:const TextStyle(fontSize:17,fontWeight:FontWeight.w800,color:ceoInk)),
      const SizedBox(height:3),
      Text(subtitle,style:const TextStyle(fontSize:12.5,color:ceoMuted,height:1.35)),
     ])),
     if(action!=null)...[const SizedBox(width:6),action!],
    ]),
    const SizedBox(height:14),
    child,
   ])),
 );
}

class CeoSearchBox extends StatelessWidget {
 final TextEditingController controller;
 final String hint;
 final ValueChanged<String> onChanged;
 const CeoSearchBox({super.key,required this.controller,
  required this.hint,required this.onChanged});

 @override Widget build(BuildContext context)=>TextField(
  key:const ValueKey('ceo-workspace-search'),
  controller:controller,onChanged:onChanged,
  textInputAction:TextInputAction.search,
  style:const TextStyle(fontSize:13,color:ceoInk),
  decoration:InputDecoration(
   hintText:hint,hintStyle:const TextStyle(fontSize:13,color:ceoMuted),
   prefixIcon:const Icon(Icons.search,size:19,color:ceoMuted),
   suffixIcon:controller.text.isEmpty?null:IconButton(
    tooltip:'Xóa tìm kiếm',onPressed:(){controller.clear();onChanged('');},
    icon:const Icon(Icons.close,size:18)),
  ),
 );
}

class CeoStatusPill extends StatelessWidget {
 final String text;
 final bool highlighted;
 const CeoStatusPill({super.key,required this.text,this.highlighted=false});
 @override Widget build(BuildContext context)=>Container(
  padding:const EdgeInsets.symmetric(horizontal:9,vertical:5),
  decoration:BoxDecoration(color:highlighted?const Color(0xFFFFF1DA):ceoLavender,
   borderRadius:BorderRadius.circular(9)),
  child:Text(text,style:TextStyle(fontSize:11.5,fontWeight:FontWeight.w700,
   color:highlighted?const Color(0xFF8A5100):ceoPurple)),
 );
}

class CeoEmptyResult extends StatelessWidget {
 final String title, detail;
 final IconData icon;
 const CeoEmptyResult({super.key,required this.title,required this.detail,
  this.icon=Icons.inbox_outlined});
 @override Widget build(BuildContext context)=>Padding(
  padding:const EdgeInsets.symmetric(vertical:30,horizontal:12),
  child:Column(children:[
   Icon(icon,color:ceoMuted,size:34),
   const SizedBox(height:10),
   Text(title,textAlign:TextAlign.center,style:const TextStyle(
    fontSize:15,fontWeight:FontWeight.w700,color:ceoInk)),
   const SizedBox(height:5),
   Text(detail,textAlign:TextAlign.center,style:const TextStyle(
    fontSize:12.5,color:ceoMuted,height:1.4)),
  ]),
 );
}

class CeoMetricCard extends StatelessWidget {
 final String label;
 final int count;
 final IconData icon;
 const CeoMetricCard({super.key,required this.label,required this.count,required this.icon});
 @override Widget build(BuildContext context)=>Container(
  padding:const EdgeInsets.all(14),
  decoration:BoxDecoration(color:ceoLavender.withValues(alpha:.5),
   border:Border.all(color:ceoBorder),borderRadius:BorderRadius.circular(13)),
  child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
   Row(children:[
    Icon(icon,color:ceoPurple,size:19),
    const Spacer(),
    Text(count.toString(),style:const TextStyle(
     fontSize:26,fontWeight:FontWeight.w800,color:ceoInk)),
   ]),
   const SizedBox(height:6),
   Text(label,maxLines:2,overflow:TextOverflow.ellipsis,
    style:const TextStyle(fontSize:12.5,color:ceoMuted,fontWeight:FontWeight.w600)),
  ]),
 );
}

class CeoDetailGroup extends StatelessWidget {
 final String title;
 final IconData icon;
 final List<Widget> children;
 const CeoDetailGroup({super.key,required this.title,required this.icon,required this.children});
 @override Widget build(BuildContext context)=>Container(
  padding:const EdgeInsets.all(16),
  decoration:BoxDecoration(color:Colors.white,
   border:Border.all(color:ceoBorder),borderRadius:BorderRadius.circular(14)),
  child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   Row(children:[
    Icon(icon,color:ceoPurple,size:19),
    const SizedBox(width:9),
    Expanded(child:Text(title,style:const TextStyle(
     fontSize:14,fontWeight:FontWeight.w800,color:ceoInk))),
   ]),
   const Divider(height:22,color:ceoBorder),
   ...children,
  ]),
 );
}

class CeoChatBubble extends StatelessWidget {
 final String text, time;
 final bool assistant;
 const CeoChatBubble({super.key,required this.text,required this.time,required this.assistant});
 @override Widget build(BuildContext context)=>Align(
  alignment:assistant?Alignment.centerRight:Alignment.centerLeft,
  child:ConstrainedBox(constraints:BoxConstraints(
   maxWidth:MediaQuery.sizeOf(context).width>=850?620:MediaQuery.sizeOf(context).width*.79),
   child:Column(crossAxisAlignment:assistant?CrossAxisAlignment.end:CrossAxisAlignment.start,
    children:[
     Padding(padding:const EdgeInsets.only(left:3,right:3,bottom:5),
      child:Text(assistant?'Trợ lý Futurebook':'Khách hàng',
       style:const TextStyle(fontSize:11.5,fontWeight:FontWeight.w700,color:ceoMuted))),
     DecoratedBox(decoration:BoxDecoration(
      color:assistant?ceoLavender:Colors.white,
      border:Border.all(color:ceoBorder),
      borderRadius:BorderRadius.circular(14)),
      child:Padding(padding:const EdgeInsets.all(13),
       child:SelectableText(text.isEmpty?'Chưa có phản hồi':text,
        style:const TextStyle(fontSize:13.5,height:1.5,color:ceoInk)))),
     if(time.isNotEmpty)Padding(padding:const EdgeInsets.only(top:5,left:3,right:3),
      child:Text(time,style:const TextStyle(fontSize:11,color:ceoMuted))),
    ]),
  ),
 );
}
