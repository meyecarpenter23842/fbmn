import 'package:flutter/material.dart';
import 'ceo_ui_tokens.dart';

/// The same 52px desktop / 56px mobile dialog header for every CEO detail sheet.
/// Uses the Futurebook UI Contract rather than screen-specific typography.
class CeoSheetHeader extends StatelessWidget{
 final String title;
 const CeoSheetHeader({super.key,required this.title});
 @override Widget build(BuildContext context){
  final mobile=MediaQuery.sizeOf(context).width<=780;
  return Container(
   height:mobile?56:52,
   decoration:const BoxDecoration(color:Color(0xFFF4EDFA),
    border:Border(bottom:BorderSide(color:Color(0xFFE5D7F1)))),
   padding:EdgeInsets.symmetric(horizontal:mobile?12:16),
   child:Row(children:[
    Container(width:3,height:20,decoration:BoxDecoration(
     color:ceoPurple,borderRadius:BorderRadius.circular(2))),
    const SizedBox(width:12),
    Expanded(child:Text(title,maxLines:2,overflow:TextOverflow.ellipsis,
     style:const TextStyle(color:Color(0xFF43215F),fontSize:16,fontWeight:FontWeight.w700))),
    IconButton(
     tooltip:'Đóng chi tiết',
     icon:const Icon(Icons.close,size:20),
     constraints:BoxConstraints(minWidth:mobile?44:36,minHeight:mobile?44:36),
     onPressed:()=>Navigator.of(context).pop(),
    ),
   ]),
  );
 }
}
