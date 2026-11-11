import 'dart:convert';
import 'package:flutter/material.dart';
import 'ceo_feedback.dart';
import 'ceo_repository.dart';
import 'ceo_mail_models.dart';
import 'ceo_ui_tokens.dart';
import 'ceo_workspace.dart';
import 'ceo_detail_sheet.dart';

String ceoMailDate(String raw){
 final d=DateTime.tryParse(raw)?.toLocal();
 if(d==null)return '';
 String two(int n)=>n.toString().padLeft(2,'0');
 return '${two(d.day)}/${two(d.month)}/${d.year} · ${two(d.hour)}:${two(d.minute)}';
}

/// One mailbox workspace; the server authenticates Owner on every operation.
class CeoMailPanel extends StatefulWidget{
 final CeoRepository api;
 final String box;
 const CeoMailPanel({super.key,required this.api,required this.box});
 @override State<CeoMailPanel> createState()=>CeoMailPanelState();
}
class CeoMailPanelState extends State<CeoMailPanel>{
 CeoMailPage? page;
 bool loading=false;
 String error='',notice='';
 @override void initState(){super.initState();Future.microtask(load);}
 @override void didUpdateWidget(covariant CeoMailPanel oldWidget){
  super.didUpdateWidget(oldWidget);
  if(oldWidget.box!=widget.box){page=null;Future.microtask(load);}
 }
 Future<void> load({bool more=false})async{
  if(loading)return;
  setState((){loading=true;error='';});
  try{
   final incoming=await widget.api.mailList(widget.box,after:more?page?.nextCursor:null);
   if(!mounted)return;
   setState(()=>page=more&&page!=null?
    CeoMailPage([...page!.items,...incoming.items],incoming.nextCursor,incoming.hasMore):
    incoming);
  }catch(e){if(mounted)setState(()=>error=e.toString());}
  finally{if(mounted)setState(()=>loading=false);}
 }
 Future<void> compose({CeoMailItem? reply})async{
  final saved=await showModalBottomSheet<bool>(context:context,
   isScrollControlled:true,useSafeArea:true,sheetAnimationStyle:ceoDetailSheetMotion(context),
   builder:(ctx)=>FractionallySizedBox(heightFactor:.94,
    child:CeoMailComposer(api:widget.api,reply:reply)));
  if(saved==true&&mounted){
   setState(()=>notice='Resend đã tiếp nhận email. Có thể kiểm tra tại Thư đã gửi.');
   if(widget.box=='sent')load();
  }
 }
 Future<void> showLetter(CeoMailItem item)async{
  await showModalBottomSheet<void>(context:context,isScrollControlled:true,
   useSafeArea:true,sheetAnimationStyle:ceoDetailSheetMotion(context),
   builder:(ctx)=>FractionallySizedBox(heightFactor:.94,
    child:Column(children:[
     CeoSheetHeader(title:widget.box=='inbox'?'Chi tiết thư đến':'Thư đã gửi'),
     Expanded(child:FutureBuilder<CeoMailItem>(
      future:widget.api.mailDetail(widget.box,item.id),
      builder:(ctx,s){
       if(s.connectionState!=ConnectionState.done){
        return const Center(child:CircularProgressIndicator());
       }
       if(s.hasError){return Center(child:Padding(
        padding:const EdgeInsets.all(20),child:Text('Không tải được thư: ${s.error}')));}
       final letter=s.data!;
       return ListView(padding:const EdgeInsets.all(16),children:[
        Text(letter.subject.isNotEmpty?letter.subject:'(Không có tiêu đề)',
         style:const TextStyle(fontSize:18,fontWeight:FontWeight.w800,color:ceoInk)),
        const SizedBox(height:12),
        Text('Từ: ${letter.from}',style:const TextStyle(fontSize:13,color:ceoMuted)),
        Text('Đến: ${letter.to.join(', ')}',style:const TextStyle(fontSize:13,color:ceoMuted)),
        Text(ceoMailDate(letter.createdAt),style:const TextStyle(fontSize:12,color:ceoMuted)),
        if(letter.status.isNotEmpty)
         Text('Trạng thái: ${letter.status}',style:const TextStyle(fontSize:12,color:ceoMuted)),
        const Divider(height:28),
        SelectableText(letter.text.isEmpty?'(Thư này chưa có nội dung văn bản)':letter.text,
         style:const TextStyle(fontSize:14,height:1.55,color:ceoInk)),
        if(letter.attachments.isNotEmpty)...[
         const Divider(height:28),
         const Text('Tệp đính kèm',style:TextStyle(fontSize:14,fontWeight:FontWeight.w700)),
         for(final file in letter.attachments)Padding(
          padding:const EdgeInsets.only(top:7),
          child:Text(file,maxLines:2,overflow:TextOverflow.ellipsis)),
         const Padding(padding:EdgeInsets.only(top:5),
          child:Text('Xem và tải file trong Resend Dashboard.',
           style:TextStyle(fontSize:12,color:ceoMuted))),
        ],
        if(widget.box=='inbox')...[
         const SizedBox(height:14),
         Text(letter.replyTo.isEmpty?'Không xác định được địa chỉ trả lời':
          'Trả lời tới: ${letter.replyTo}',
          style:const TextStyle(fontSize:12.5,color:ceoMuted)),
         const SizedBox(height:20),
         FilledButton.icon(
          onPressed:letter.replyTo.isEmpty?null:(){
           Navigator.of(ctx).pop();
           Future.delayed(const Duration(milliseconds:280),(){
            if(mounted)compose(reply:letter);
           });
          },icon:const Icon(Icons.reply,size:18),label:const Text('Trả lời')),
        ],
       ]);
      })),
    ])));
 }
 @override Widget build(BuildContext context){
  final items=page?.items??const <CeoMailItem>[];
  return Stack(children:[ListView(physics:const AlwaysScrollableScrollPhysics(),children:[
   CeoPanel(title:widget.box=='inbox'?'Hộp thư đến':'Thư đã gửi',
    subtitle:widget.box=='inbox'?'Thư nhận tại info@fbmn.vn':'Thư gửi từ info@fbmn.vn',
    icon:widget.box=='inbox'?Icons.markunread_mailbox_outlined:Icons.outbox_outlined,
    action:IconButton(tooltip:'Làm mới email',onPressed:loading?null:()=>load(),
     icon:const Icon(Icons.refresh,color:ceoPurple)),
    child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
     Align(alignment:Alignment.centerRight,
      child:FilledButton.icon(onPressed:loading?null:()=>compose(),
       icon:const Icon(Icons.edit_outlined,size:18),label:const Text('Soạn thư'))),
     if(loading&&page==null)const Padding(padding:EdgeInsets.all(30),
      child:Center(child:CircularProgressIndicator())),
     if(!loading&&error.isEmpty&&page!=null&&items.isEmpty)CeoEmptyResult(title:'Chưa có email',
      detail:widget.box=='inbox'?'Chưa có email nhận được qua Resend.':
       'Chưa có email gửi đi được ghi nhận trên Resend.',
      icon:Icons.mail_outline),
     for(final item in items)Material(color:Colors.transparent,child:InkWell(
      key:ValueKey('ceo-mail-item-${item.id}'),onTap:()=>showLetter(item),
      child:Padding(padding:const EdgeInsets.symmetric(vertical:12),child:Row(children:[
       CircleAvatar(radius:21,backgroundColor:ceoLavender,
        child:Icon(widget.box=='inbox'?Icons.mail_outline:Icons.send_outlined,
         color:ceoPurple,size:19)),
       const SizedBox(width:10),
       Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
        Text(widget.box=='inbox'?item.from:item.to.join(', '),
         maxLines:1,overflow:TextOverflow.ellipsis,
         style:const TextStyle(fontWeight:FontWeight.w700,fontSize:13.5,color:ceoInk)),
        const SizedBox(height:4),
        Text(item.subject.isEmpty?'(Không có tiêu đề)':item.subject,
         maxLines:2,overflow:TextOverflow.ellipsis,
         style:const TextStyle(fontSize:13,color:ceoMuted)),
        const SizedBox(height:4),
        Text(ceoMailDate(item.createdAt)+
         (item.status.isNotEmpty?' · ${item.status}':''),
         style:const TextStyle(fontSize:11.5,color:ceoMuted)),
       ])),
       const Icon(Icons.chevron_right,color:ceoMuted,size:18),
      ])))),
     if(loading&&page!=null)const Center(child:Padding(
      padding:EdgeInsets.all(10),child:CircularProgressIndicator())),
     if(page?.hasMore==true)OutlinedButton(onPressed:loading?null:()=>load(more:true),
      child:const Text('Tải thêm')),
    ])),
   const SizedBox(height:24),
  ]),
  if(notice.isNotEmpty||error.isNotEmpty)
   Positioned(top:10,right:12,left:12,
    child:Align(alignment:Alignment.topRight,
     child:CeoErrorToast(key:ValueKey('mail-$notice-$error'),
      message:notice.isNotEmpty?notice:error,success:notice.isNotEmpty,
      onRetry:()=>load(),onClose:(){if(mounted)setState((){notice='';error='';});}))),
  ]);
 }
}

class CeoMailComposer extends StatefulWidget{
 final CeoRepository api;
 final CeoMailItem? reply;
 const CeoMailComposer({super.key,required this.api,this.reply});
 @override State<CeoMailComposer> createState()=>_CeoMailComposerState();
}
class _CeoMailComposerState extends State<CeoMailComposer>{
 late final recipient=TextEditingController(text:widget.reply?.replyTo??'');
 late final subject=TextEditingController(text:widget.reply==null?'':(
  widget.reply!.subject.toLowerCase().startsWith('re:')?
  widget.reply!.subject:'Re: ${widget.reply!.subject}'));
 final message=TextEditingController();
 bool saving=false,uncertainFailure=false;
 String error='',networkNotice='';
 String? lastPayload,lastRequestId,confirmNewPayload;
 @override void dispose(){recipient.dispose();subject.dispose();message.dispose();super.dispose();}
 Future<void> send()async{
  if(saving){return;}
  if(widget.reply==null&&(!recipient.text.contains('@')||recipient.text.length>320)){
   setState(()=>error='Nhập địa chỉ email hợp lệ.');return;
  }
  if(subject.text.trim().isEmpty||message.text.trim().isEmpty){
   setState(()=>error='Vui lòng nhập tiêu đề và nội dung.');return;
  }
  final payload=jsonEncode([recipient.text.trim(),subject.text.trim(),
   message.text.trim(),widget.reply?.id]);
  if(uncertainFailure&&payload!=lastPayload&&confirmNewPayload!=payload){
   setState((){confirmNewPayload=payload;
    error='Lượt gửi trước có thể đã được tiếp nhận. Bấm Gửi thêm lần nữa để gửi phiên bản mới.';});
   return;
  }
  if(payload!=lastPayload){
   lastPayload=payload;
   lastRequestId='mail-${DateTime.now().microsecondsSinceEpoch}';
  }
  setState((){saving=true;error='';networkNotice='';});
  try{
   await widget.api.mailSend(to:recipient.text.trim(),subject:subject.text.trim(),
    text:message.text.trim(),replyId:widget.reply?.id,requestId:lastRequestId);
   if(mounted){Navigator.of(context).pop(true);}
  }catch(_){
   if(mounted){
    setState((){
     uncertainFailure=true;
     networkNotice='Không xác nhận được lượt gửi. Nếu giữ nguyên nội dung, thử lại sẽ dùng cùng mã gửi.';
    });
   }
  }finally{
   if(mounted){setState(()=>saving=false);}
  }
 }
 @override Widget build(BuildContext context)=>Stack(children:[
  Column(children:[
  const CeoSheetHeader(title:'Soạn email Futurebook'),
  Expanded(child:SingleChildScrollView(padding:EdgeInsets.fromLTRB(
   16,12,16,MediaQuery.viewInsetsOf(context).bottom+24),
   child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
    const Text('Từ: info@fbmn.vn',
     style:TextStyle(color:ceoPurple,fontWeight:FontWeight.w700,fontSize:13)),
    const SizedBox(height:12),
    TextField(controller:recipient,readOnly:widget.reply!=null,
     keyboardType:TextInputType.emailAddress,
     decoration:const InputDecoration(labelText:'Gửi đến',hintText:'khachhang@example.com')),
    const SizedBox(height:12),
    TextField(controller:subject,readOnly:widget.reply!=null,
     decoration:const InputDecoration(labelText:'Tiêu đề')),
    const SizedBox(height:12),
    TextField(controller:message,minLines:6,maxLines:10,maxLength:12000,
     decoration:const InputDecoration(labelText:'Nội dung',alignLabelWithHint:true)),
    const SizedBox(height:6),
    const Text('Email tự thêm logo, địa chỉ, website và liên kết Facebook của Futurebook ở cuối.',
     style:TextStyle(color:ceoMuted,fontSize:12.5,height:1.4)),
    if(error.isNotEmpty)Padding(padding:const EdgeInsets.only(top:8),
     child:Text(error,style:const TextStyle(color:Colors.red,fontSize:13))),
    const SizedBox(height:14),
    FilledButton.icon(onPressed:saving?null:send,
     icon:const Icon(Icons.send,size:18),
     label:Text(saving?'Đang gửi...':'Gửi email')),
   ]))),
 ]),
  if(networkNotice.isNotEmpty)
   Positioned(top:10,right:12,left:12,child:Align(alignment:Alignment.topRight,
    child:CeoErrorToast(key:ValueKey(networkNotice),message:networkNotice,
     onRetry:send,onClose:(){if(mounted)setState(()=>networkNotice='');}))),
 ]);
}
