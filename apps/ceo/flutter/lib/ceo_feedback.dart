import 'dart:async';
import 'package:flutter/material.dart';
import 'ceo_ui_tokens.dart';

/// Shared, non-layout-shifting, top-right operation toast.
/// A persistent access/permission denial is still handled by the login screen.
class CeoErrorToast extends StatefulWidget{
 final String message;
 final VoidCallback onRetry,onClose;
 const CeoErrorToast({super.key,required this.message,required this.onRetry,required this.onClose});
 @override State<CeoErrorToast> createState()=>_CeoErrorToastState();
}
class _CeoErrorToastState extends State<CeoErrorToast>{
 Timer? timer;
 bool shown=false;
 @override void initState(){
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_){
   if(mounted)setState(()=>shown=true);
  });
  timer=Timer(const Duration(milliseconds:4800),hide);
 }
 @override void dispose(){timer?.cancel();super.dispose();}
 Future<void> hide()async{
  if(!mounted||!shown)return;
  timer?.cancel();
  final reduced=MediaQuery.maybeOf(context)?.disableAnimations??false;
  setState(()=>shown=false);
  await Future<void>.delayed(reduced?Duration.zero:const Duration(milliseconds:190));
  if(mounted)widget.onClose();
 }
 @override Widget build(BuildContext context){
  final reduced=MediaQuery.of(context).disableAnimations;
  return ConstrainedBox(constraints:const BoxConstraints(maxWidth:404),
   child:AnimatedSlide(
    duration:reduced?Duration.zero:Duration(milliseconds:shown?220:190),
    curve:shown?Curves.easeOutCubic:Curves.easeInCubic,
    offset:shown?Offset.zero:const Offset(.14,0),
    child:AnimatedOpacity(
     duration:reduced?Duration.zero:Duration(milliseconds:shown?220:190),
     opacity:shown?1:0,
     child:Material(
      color:Colors.white,elevation:4,
      shadowColor:const Color(0x221F183B),
      shape:RoundedRectangleBorder(borderRadius:BorderRadius.circular(12),
       side:const BorderSide(color:Color(0xFFE5D7F1))),
      clipBehavior:Clip.antiAlias,
      child:Column(mainAxisSize:MainAxisSize.min,children:[
       ConstrainedBox(constraints:const BoxConstraints(minHeight:66),
        child:Padding(padding:const EdgeInsets.fromLTRB(12,10,6,10),
         child:Row(children:[
          const Icon(Icons.error_outline,color:Color(0xFFB42318),size:22),
          const SizedBox(width:10),
          Expanded(child:Text(widget.message,maxLines:3,
           overflow:TextOverflow.ellipsis,
           style:const TextStyle(fontSize:13,height:1.3))),
          TextButton(onPressed:(){timer?.cancel();widget.onRetry();},
           child:const Text('Thử lại')),
          IconButton(tooltip:'Đóng thông báo',onPressed:hide,
           constraints:const BoxConstraints(minWidth:36,minHeight:36),
           icon:const Icon(Icons.close,size:18)),
         ]))),
       SizedBox(height:3,child:TweenAnimationBuilder<double>(
        key:ValueKey(widget.message),
        tween:Tween(begin:1,end:0),
        duration:reduced?Duration.zero:const Duration(milliseconds:4800),
        builder:(context,value,child)=>Align(alignment:Alignment.centerLeft,
         child:FractionallySizedBox(widthFactor:value,
          child:const ColoredBox(color:ceoPurple))),
       )),
      ]),
     ),
    ),
   ),
  );
 }
}
