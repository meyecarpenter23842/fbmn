import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
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
 final VoidCallback? onMarkedRead;
 const CeoMailPanel({super.key,required this.api,required this.box,this.onMarkedRead});
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
    CeoMailPage([...page!.items,...incoming.items],incoming.nextCursor,incoming.hasMore,
     readStateAvailable:page!.readStateAvailable&&incoming.readStateAvailable):
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
 Future<void> showLetter(CeoMailItem item)=>openMailById(item.id);
 // Public to the Owner workspace for a validated notification deep link.
 Future<void> openMailById(String id)async{
  final box=widget.box;
  String? readWarning;
  Future<bool> saveRead()async{
   try{
    await widget.api.markAlertRead('mail',id);
    if(mounted){
     setState((){
      if(page!=null){
       page=CeoMailPage(page!.items.map((item)=>
        item.id==id?item.withUnread(false):item).toList(growable:false),
        page!.nextCursor,page!.hasMore,readStateAvailable:page!.readStateAvailable);
      }
     });
     widget.onMarkedRead?.call();
    }
    return true;
   }catch(_){return false;}
  }
  // The Future must be stable across notification counter UI rebuilds.
  final detailFuture=widget.api.mailDetail(box,id).then((letter)async{
   if(box=='inbox'&&!await saveRead()){
    readWarning='Đã mở thư nhưng chưa lưu được trạng thái đã xem.';
   }
   return letter;
  });
  await showModalBottomSheet<void>(context:context,isScrollControlled:true,
   useSafeArea:true,sheetAnimationStyle:ceoDetailSheetMotion(context),
   builder:(ctx)=>StatefulBuilder(builder:(ctx,setModal)=>FractionallySizedBox(heightFactor:.94,
    child:Column(children:[
     CeoSheetHeader(title:box=='inbox'?'Chi tiết thư đến':'Thư đã gửi'),
     Expanded(child:FutureBuilder<CeoMailItem>(
      future:detailFuture,
      builder:(ctx,s){
       if(s.connectionState!=ConnectionState.done){
        return const Center(child:CircularProgressIndicator());
       }
       if(s.hasError){return Center(child:Padding(
        padding:const EdgeInsets.all(20),child:Text('Không tải được thư: ${s.error}')));}
       final letter=s.data!;
       return ListView(padding:const EdgeInsets.all(16),children:[
        if(readWarning!=null)Card(
         color:const Color(0xFFFFF3E7),
         child:Padding(padding:const EdgeInsets.all(10),child:Column(
          crossAxisAlignment:CrossAxisAlignment.start,children:[
           Text(readWarning!,style:const TextStyle(fontSize:12.5,color:Color(0xFF92400E))),
           Align(alignment:Alignment.centerRight,child:TextButton(
            onPressed:()async{
             if(await saveRead()){setModal(()=>readWarning=null);}
             else{setModal(()=>readWarning='Chưa lưu được đã xem. Anh thử lại.');}
            },child:const Text('Thử lưu đã xem lại')))
          ]))),

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
        if(box=='inbox')...[
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
    ]))));
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
     if(widget.box=='inbox'&&page?.readStateAvailable==false)
      const Padding(padding:EdgeInsets.symmetric(vertical:8),child:Text(
       'Dữ liệu đã xem chưa đồng bộ; có thể đọc thư nhưng badge có thể chưa cập nhật.',
       style:TextStyle(fontSize:12,color:Color(0xFF92400E)))),
     if(widget.box=='inbox'&&page?.readStateAvailable==true&&items.any((item)=>item.unread))
      const Padding(padding:EdgeInsets.only(top:8,bottom:6),child:Text(
       'Thư chưa xem có nhãn đỏ. Mở đúng thư đó để giảm số thông báo.',
       style:TextStyle(fontSize:12,color:ceoMuted))),
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
         style:TextStyle(fontWeight:item.unread?FontWeight.w800:FontWeight.w600,
          fontSize:13.5,color:ceoInk)),
        if(widget.box=='inbox'&&item.unread)Padding(
         padding:const EdgeInsets.only(bottom:4),child:Align(
          alignment:Alignment.centerLeft,
          child:Container(padding:const EdgeInsets.symmetric(horizontal:7,vertical:3),
           decoration:BoxDecoration(color:const Color(0xFFDC2626),
            borderRadius:BorderRadius.circular(8)),
           child:const Text('Chưa xem',style:TextStyle(
            fontSize:11,fontWeight:FontWeight.w700,color:Colors.white))))),
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
 bool saving=false,picking=false,uncertainFailure=false;
 final List<CeoMailAttachment> attachments=[];
 static const maxFiles=5,maxTotalBytes=3000000;
 static const allowedExtensions=<String>['pdf','doc','docx','xls','xlsx',
  'ppt','pptx','csv','txt','png','jpg','jpeg','webp'];
 String error='',networkNotice='';
 String? lastPayload,lastRequestId,confirmNewPayload;
 @override void dispose(){recipient.dispose();subject.dispose();message.dispose();super.dispose();}
 Future<void> pickAttachments()async{
  if(saving||picking)return;
  setState((){picking=true;error='';});
  try{
   final picked=await FilePicker.platform.pickFiles(
    type:FileType.custom,allowedExtensions:allowedExtensions,
    allowMultiple:true,withData:true);
   if(!mounted||picked==null)return;
   final files=[...attachments];
   var total=files.fold<int>(0,(sum,file)=>sum+file.size);
   for(final file in picked.files){
    if(files.length>=maxFiles){
     throw const FormatException('Tối đa 5 tệp đính kèm trong một email.');
    }
    final filename=file.name.trim(),bytes=file.bytes;
    final ext=filename.split('.').last.toLowerCase();
    if(!allowedExtensions.contains(ext)||filename.length>160||
      filename.contains('/')||filename.contains('\\')){
     throw const FormatException('Định dạng hoặc tên tệp chưa được hỗ trợ.');
    }
    if(bytes==null||bytes.isEmpty){
     throw const FormatException('Không đọc được tệp hoặc tệp đang trống.');
    }
    if(bytes.length>maxTotalBytes-total){
     throw const FormatException('Tổng tệp đính kèm không vượt 3 MB.');
    }
    total+=bytes.length;
    files.add(CeoMailAttachment(filename:filename,
     content:base64Encode(bytes),size:bytes.length));
   }
   if(mounted)setState((){attachments..clear()..addAll(files);});
  }catch(e){
   if(mounted){
    setState(()=>error=e is FormatException?e.message:
     'Không mở hoặc đọc được tệp. Vui lòng chọn lại.');
   }
  }finally{if(mounted)setState(()=>picking=false);}
 }
 Future<void> send()async{
  if(saving||picking){return;}
  if(widget.reply==null&&(!recipient.text.contains('@')||recipient.text.length>320)){
   setState(()=>error='Nhập địa chỉ email hợp lệ.');return;
  }
  if(subject.text.trim().isEmpty||message.text.trim().isEmpty){
   setState(()=>error='Vui lòng nhập tiêu đề và nội dung.');return;
  }
  // A grapheme can contain several UTF-8 code points. Check the same
  // 100 KB request budget the Owner Gateway enforces before attempting send.
  final requestBytes=utf8.encode(jsonEncode({
   'to':recipient.text.trim(),'subject':subject.text.trim(),
   'text':message.text.trim(),
   if(widget.reply!=null)'replyId':widget.reply!.id,
   if(attachments.isNotEmpty)'attachments':attachments.map((a)=>a.toJson()).toList(),
   'requestId':'x'.padRight(100,'x'), // Conservative upper bound for the request ID.
  })).length;
  if(requestBytes>(attachments.isEmpty?100000:4300000)){
   setState(()=>error='Email hoặc tệp đính kèm vượt dung lượng cho phép.');
   return;
  }
  final payload=jsonEncode([recipient.text.trim(),subject.text.trim(),
   message.text.trim(),widget.reply?.id,
   for(final a in attachments)[a.filename,a.size,a.content]]);
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
    text:message.text.trim(),replyId:widget.reply?.id,requestId:lastRequestId,
    attachments:List.unmodifiable(attachments));
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
     maxLength:widget.reply==null?180:null,
     decoration:const InputDecoration(labelText:'Tiêu đề')),
    const SizedBox(height:12),
    TextField(controller:message,minLines:6,maxLines:10,maxLength:12000,
     decoration:const InputDecoration(labelText:'Nội dung',alignLabelWithHint:true)),
    const SizedBox(height:10),
    Align(alignment:Alignment.centerLeft,child:OutlinedButton.icon(
     onPressed:saving||picking?null:pickAttachments,
     icon:const Icon(Icons.attach_file,size:18),
     label:Text(picking?'Đang đọc tệp...':'Đính kèm tệp'))),
    Padding(padding:const EdgeInsets.only(top:4,bottom:8),
     child:Text('${attachments.length}/5 tệp · Tổng tối đa 3 MB · PDF, Word, Excel, PowerPoint, ảnh, CSV, TXT',
      style:const TextStyle(color:ceoMuted,fontSize:12))),
    for(var i=0;i<attachments.length;i++)
     Padding(padding:const EdgeInsets.only(bottom:5),
      child:Row(children:[
       const Icon(Icons.insert_drive_file_outlined,size:18,color:ceoPurple),
       const SizedBox(width:7),
       Expanded(child:Text('${attachments[i].filename} · ${(attachments[i].size/1024).toStringAsFixed(0)} KB',
        maxLines:1,overflow:TextOverflow.ellipsis,
        style:const TextStyle(color:ceoInk,fontSize:12.5))),
       IconButton(tooltip:'Bỏ tệp ${attachments[i].filename}',
        onPressed:saving?null:(){setState(()=>attachments.removeAt(i));},
        icon:const Icon(Icons.close,size:18)),
      ])),
    const SizedBox(height:6),
    const Text('Email tự thêm logo, địa chỉ, website và liên kết Facebook của Futurebook ở cuối.',
     style:TextStyle(color:ceoMuted,fontSize:12.5,height:1.4)),
    if(error.isNotEmpty)Padding(padding:const EdgeInsets.only(top:8),
     child:Text(error,style:const TextStyle(color:Colors.red,fontSize:13))),
    const SizedBox(height:14),
    FilledButton.icon(onPressed:saving||picking?null:send,
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
