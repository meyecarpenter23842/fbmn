import 'dart:async';
import 'package:flutter/material.dart';
import 'ceo_models.dart';
import 'ceo_repository.dart';
import 'ceo_ui_tokens.dart';
import 'ceo_detail_sheet.dart';
import 'ceo_workspace.dart';

/// Owner chat receipt is saved for the exact last rendered turn, not when
/// merely selecting the chat tab. Any write failure remains visible/retryable.
class CeoChatDetail extends StatefulWidget {
 final CeoRepository api;
 final String session;
 final ValueChanged<CeoAlerts> onAlerts;
 final String Function(String) formatDate;
 const CeoChatDetail({super.key,required this.api,required this.session,
  required this.onAlerts,required this.formatDate});
 @override State<CeoChatDetail> createState()=>_CeoChatDetailState();
}

class _CeoChatDetailState extends State<CeoChatDetail>{
 late Future<List<CeoTurn>> _future;
 bool _attempted=false,_saving=false,_saved=false,_hasNewer=false;
 bool _mustReload=false;
 String? _lastTurnId,_notice;
 static final _turnId=RegExp(r'^[1-9][0-9]{0,18}$');
 @override void initState(){
  super.initState();
  _future=widget.api.turns(widget.session);
 }
 void _scheduleRead(List<CeoTurn> turns){
  if(_attempted||turns.isEmpty)return;
  _attempted=true;
  _lastTurnId=turns.last.id;
  WidgetsBinding.instance.addPostFrameCallback((_){
   if(!mounted)return;
   if(_lastTurnId==null||!_turnId.hasMatch(_lastTurnId!)){
    setState(()=>_notice='Không xác định được lượt chat cuối. Tải lại hội thoại để lưu đã xem.');
   }else{unawaited(_saveRead());}
  });
 }
 Future<void> _saveRead()async{
  if(_saving||_lastTurnId==null||!_turnId.hasMatch(_lastTurnId!))return;
  // Capture the Owner API and parent callback before the first await: the
  // sheet may be dismissed while the request is in flight.
  final api=widget.api;
  final session=widget.session;
  final onAlerts=widget.onAlerts;
  final turnId=_lastTurnId!;
  setState((){_saving=true;_notice=null;});
  try{
   await api.markAlertRead('chat',session,turnId:turnId);
   if(mounted){setState(()=>_saved=true);}
   // Even if the detail sheet was closed, the confirmed read must refresh
   // the parent bell/tab/app badge promptly rather than waiting 60 seconds.
   try{
    final state=await api.loadAlerts();
    onAlerts(state); // Parent callback checks its own mounted state.
    if(mounted){
     setState((){
      _hasNewer=state.chatIds.contains(session);
      _notice=null;
     });
    }
   }catch(_){
    if(mounted){setState(()=>_notice=
     'Đã lưu đã xem trên máy chủ, nhưng chưa tải lại được số thông báo.');}
   }
  }on CeoApiException catch(error){
   if(mounted){setState((){
    _saved=false;
    _mustReload=error.status==404;
    _notice=switch(error.status){
     401=>'Phiên Owner cần xác minh lại (401). Chưa lưu đã xem.',
     403=>'Tài khoản không có quyền đánh dấu đã xem (403).',
     404=>'Không tìm thấy lượt chat vừa xem (404). Anh tải lại hội thoại.',
     _=>'Máy chủ chưa lưu được trạng thái đã xem (${error.status}). Anh thử lại.'
    };
   });}
  }catch(_){
   if(mounted){setState((){
    _saved=false;
    _notice='Chưa kết nối được để lưu đã xem. Anh bấm thử lại.';
   });}
  }finally{
   if(mounted){setState(()=>_saving=false);}
  }
 }
 void _reload(){
  setState((){
   _future=widget.api.turns(widget.session);
   _attempted=false;_lastTurnId=null;_notice=null;
   _saved=false;_saving=false;_hasNewer=false;_mustReload=false;
  });
 }
 @override Widget build(BuildContext context)=>Column(children:[
  const CeoSheetHeader(title:'Nội dung hội thoại'),
  Expanded(child:FutureBuilder<List<CeoTurn>>(
   future:_future,
   builder:(context,state){
    if(state.connectionState!=ConnectionState.done){
     return const Center(child:CircularProgressIndicator());
    }
    if(state.hasError)return ListView(padding:const EdgeInsets.all(16),children:[
     const CeoEmptyResult(title:'Không tải được hội thoại',
      detail:'Dữ liệu hội thoại chưa được tải. Thử lại khi có kết nối.',
      icon:Icons.error_outline),
     const SizedBox(height:12),
     OutlinedButton.icon(onPressed:_reload,icon:const Icon(Icons.refresh),
      label:const Text('Tải lại hội thoại')),
    ]);
    final turns=state.data??<CeoTurn>[];
    _scheduleRead(turns);
    return ListView(padding:const EdgeInsets.all(16),children:[
     if(_saving)const Padding(padding:EdgeInsets.only(bottom:8),
      child:Row(children:[
       SizedBox(width:15,height:15,child:CircularProgressIndicator(strokeWidth:2)),
       SizedBox(width:8),Text('Đang lưu đã xem...',style:TextStyle(fontSize:13))
      ])),
     if(_notice!=null)Card(
      color:const Color(0xFFFFF3E7),
      child:Padding(padding:const EdgeInsets.all(12),child:Column(
       crossAxisAlignment:CrossAxisAlignment.stretch,children:[
        Text(_notice!,style:const TextStyle(fontSize:13,color:Color(0xFF92400E))),
        const SizedBox(height:6),
        Align(alignment:Alignment.centerRight,child:TextButton(
         onPressed:_saving?null:(_saved||_mustReload||_lastTurnId==null?_reload:_saveRead),
         child:Text(_saved||_mustReload||_lastTurnId==null?
          'Tải lại hội thoại':'Thử lưu đã xem lại')))
       ]))),
     if(_hasNewer)Card(
      color:ceoLavender,child:Padding(padding:const EdgeInsets.all(12),
       child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
        const Text('Có tin mới đến sau lượt vừa xem. Badge vẫn giữ để tránh bỏ sót.',
         style:TextStyle(fontSize:13,color:ceoInk)),
        Align(alignment:Alignment.centerRight,child:TextButton(
         onPressed:_reload,child:const Text('Tải tin mới')))
       ]))),
     if(_saved&&!_hasNewer&&_notice==null)
      const Padding(padding:EdgeInsets.only(bottom:9),
       child:Row(children:[Icon(Icons.done_all,color:Color(0xFF247A53),size:17),
        SizedBox(width:6),Text('Đã xem đến lượt chat cuối',
         style:TextStyle(fontSize:12.5,color:ceoMuted))])),
     Container(padding:const EdgeInsets.all(12),
      decoration:BoxDecoration(color:ceoLavender,
       borderRadius:BorderRadius.circular(12)),
      child:const Text('25 lượt hội thoại gần nhất. Xem đầy đủ lịch sử trong Admin.',
       style:TextStyle(fontSize:12.5,color:ceoInk,height:1.4))),
     const SizedBox(height:18),
     if(turns.isEmpty)const CeoEmptyResult(title:'Chưa có tin nhắn',
      detail:'Phiên này chưa có lượt hội thoại trong dữ liệu trả về.',
      icon:Icons.chat_outlined),
     for(final turn in turns)...[
      CeoChatBubble(text:turn.question,time:widget.formatDate(turn.createdAt),
       assistant:false),
      const SizedBox(height:12),
      CeoChatBubble(text:turn.answer,time:'',assistant:true),
      const SizedBox(height:18)
     ],
    ]);
   }
  ))
 ]);
}
