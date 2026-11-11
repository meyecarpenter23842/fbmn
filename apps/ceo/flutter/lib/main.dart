import 'package:flutter/material.dart';
import 'ceo_models.dart';
import 'ceo_repository.dart';
import 'ceo_ui_tokens.dart';

void main() => runApp(const CeoApp());
const brand = Color(0xFF6D249E);
const names = ['Tổng quan', 'Hội thoại', 'Gia công', 'Liên hệ', 'Thống kê'];
const symbols = [Icons.dashboard_outlined, Icons.forum_outlined,
  Icons.handyman_outlined, Icons.mail_outline, Icons.bar_chart_outlined];
String dateString(String value) {
 final d=DateTime.tryParse(value)?.toUtc().add(const Duration(hours:7));
 if(d==null)return '';
 String two(int n)=>n.toString().padLeft(2,'0');
 return '${two(d.day)}/${two(d.month)}/${d.year} · ${two(d.hour)}:${two(d.minute)}';
}
String userError(Object error)=>error is CeoApiException?error.toString():'Không kết nối được dịch vụ.';

class CeoApp extends StatefulWidget {
 final CeoRepository? repository;
 const CeoApp({super.key,this.repository});
 @override State<CeoApp> createState()=>_CeoAppState();
}
class _CeoAppState extends State<CeoApp>{
 late final CeoRepository api=widget.repository??CeoApi();
 bool? owner;
 String notice='';
 @override void initState(){super.initState();check();}
 Future<void> check()async{
  setState((){owner=null;notice='';});
  try{final valid=await api.ownerSession();if(mounted)setState(()=>owner=valid);}
  catch(e){if(mounted)setState((){owner=false;notice=userError(e);});}
 }
 @override void dispose(){if(widget.repository==null)api.dispose();super.dispose();}
 @override Widget build(BuildContext context)=>LayoutBuilder(builder:(context,size)=>MaterialApp(
  title:'Futurebook CEO',debugShowCheckedModeBanner:false,
  theme:ceoTheme(size.maxWidth),
  home:owner==null?const Scaffold(body:Center(child:CircularProgressIndicator())):
   owner!?CeoHome(api:api,onSignOut:()=>setState(()=>owner=false)):
    CeoLogin(api:api,notice:notice,onSignIn:()=>setState(()=>owner=true),onRetry:check)));
}

class CeoLogin extends StatefulWidget {
 final CeoRepository api;
 final String notice;
 final VoidCallback onSignIn,onRetry;
 const CeoLogin({super.key,required this.api,required this.notice,required this.onSignIn,required this.onRetry});
 @override State<CeoLogin> createState()=>_CeoLoginState();
}
class _CeoLoginState extends State<CeoLogin>{
 final form=GlobalKey<FormState>();
 final email=TextEditingController(),password=TextEditingController();
 bool sending=false;String error='';
 @override void dispose(){email.dispose();password.dispose();super.dispose();}
 Future<void> submit()async{
  if(sending||!form.currentState!.validate())return;
  setState((){sending=true;error='';});
  try{await widget.api.signIn(email.text,password.text);
   password.clear();if(mounted)widget.onSignIn();
  }catch(e){if(mounted)setState(()=>error=userError(e));}
  finally{password.clear();if(mounted)setState(()=>sending=false);}
 }
 @override Widget build(BuildContext context)=>Scaffold(body:Center(child:ConstrainedBox(
  constraints:const BoxConstraints(maxWidth:460),
  child:SingleChildScrollView(padding:const EdgeInsets.all(24),child:Form(key:form,
   child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
    Image.asset('assets/brand/fbmn-official-logo.webp',height:64,fit:BoxFit.contain),
    const SizedBox(height:12),
    const Text('FUTUREBOOK MIỀN NAM',textAlign:TextAlign.center,
     style:TextStyle(color:brand,letterSpacing:2,fontSize:13,fontWeight:FontWeight.bold)),
    const SizedBox(height:8),
    const Text('Bảng điều hành CEO',textAlign:TextAlign.center,
     style:TextStyle(fontSize:28,fontWeight:FontWeight.w800)),
    const SizedBox(height:6),
    const Text('Đăng nhập với tài khoản Owner đã được cấp quyền trong Futurebook Admin.',
      textAlign:TextAlign.center),
    const SizedBox(height:24),
    TextFormField(controller:email,keyboardType:TextInputType.emailAddress,
     autofillHints:const [AutofillHints.email],decoration:const InputDecoration(labelText:'Email'),
     validator:(s)=>s==null||!s.contains('@')?'Nhập email hợp lệ':null),
    const SizedBox(height:12),
    TextFormField(controller:password,obscureText:true,
     autofillHints:const [AutofillHints.password],
     decoration:const InputDecoration(labelText:'Mật khẩu'),
     onFieldSubmitted:(_)=>submit(),
     validator:(s)=>s==null||s.isEmpty?'Nhập mật khẩu':null),
    const SizedBox(height:14),
    if(widget.notice.isNotEmpty)Text(widget.notice,style:const TextStyle(color:Colors.red)),
    if(error.isNotEmpty)Text(error,style:const TextStyle(color:Colors.red)),
    const SizedBox(height:12),
    FilledButton(onPressed:sending?null:submit,
     child:sending?const CircularProgressIndicator():const Text('Đăng nhập')),
    TextButton(onPressed:sending?null:widget.onRetry,child:const Text('Kiểm tra lại phiên')),
   ]))))));
}

class CeoHome extends StatefulWidget{
 final CeoRepository api;
 final VoidCallback onSignOut;
 const CeoHome({super.key,required this.api,required this.onSignOut});
 @override State<CeoHome> createState()=>_CeoHomeState();
}
class _CeoHomeState extends State<CeoHome>{
 int selected=0;
 bool loading=false;
 String error='';
 bool pendingRefresh=false;
 CeoPage<CeoConversation>? conversations;
 CeoPage<CeoRequest>? outsourcing,contacts;
 @override void initState(){super.initState();Future.microtask(refresh);}
 Future<void> refresh()async{
  if(loading){pendingRefresh=true;return;}
  final tabAtStart=selected;
  setState((){loading=true;error='';});
  try{
   if(tabAtStart==0){
    final result=await Future.wait<Object>([
      widget.api.conversations(),widget.api.outsourcingRequests(),widget.api.contactRequests()]);
    if(mounted){setState((){
      conversations=result[0] as CeoPage<CeoConversation>;
      outsourcing=result[1] as CeoPage<CeoRequest>;
      contacts=result[2] as CeoPage<CeoRequest>;
    });}
   }else if(tabAtStart==1){final v=await widget.api.conversations();
    if(mounted)setState(()=>conversations=v);}
   else if(tabAtStart==2){final v=await widget.api.outsourcingRequests();
    if(mounted)setState(()=>outsourcing=v);}
   else if(tabAtStart==3){final v=await widget.api.contactRequests();
    if(mounted)setState(()=>contacts=v);}
  }catch(e){if(mounted)setState(()=>error=userError(e));}
  finally{endLoad(tabAtStart);}
 }
 void endLoad(int previousTab){
  if(!mounted)return;
  final reload=selected!=4&&pendingRefresh&&selected!=previousTab;
  pendingRefresh=false;
  setState(()=>loading=false);
  if(reload)Future.microtask(refresh);
 }
 void choose(int value){
  if(value==selected)return;
  setState((){selected=value;error='';});
  if(value!=4)Future.microtask(refresh);
 }
 Future<void> more()async{
  if(loading)return;
  final tabAtStart=selected;
  setState(()=>loading=true);
  try{
   if(selected==1&&conversations?.hasMore==true){
    final v=await widget.api.conversations(conversations!.page+1);
    if(mounted)setState(()=>conversations=CeoPage([...conversations!.items,...v.items],v.page,v.hasMore));
   }else if(selected==2&&outsourcing?.hasMore==true){
    final v=await widget.api.outsourcingRequests(outsourcing!.page+1);
    if(mounted)setState(()=>outsourcing=CeoPage([...outsourcing!.items,...v.items],v.page,v.hasMore));
   }else if(selected==3&&contacts?.hasMore==true){
    final v=await widget.api.contactRequests(contacts!.page+1);
    if(mounted)setState(()=>contacts=CeoPage([...contacts!.items,...v.items],v.page,v.hasMore));
   }
  }catch(e){if(mounted)setState(()=>error=userError(e));}
  finally{endLoad(tabAtStart);}
 }
 Future<void> logout()async{
  if(loading)return;
  setState(()=>loading=true);
  try{await widget.api.signOut();if(mounted)widget.onSignOut();}
  catch(e){if(mounted)setState(()=>error=userError(e));}
  finally{if(mounted)setState(()=>loading=false);}
 }
 @override Widget build(BuildContext context)=>LayoutBuilder(builder:(context,box){
  final wide=box.maxWidth>=850;
  return Scaffold(
   appBar:AppBar(backgroundColor:Colors.white,title:Column(crossAxisAlignment:CrossAxisAlignment.start,
    children:[const Text('Futurebook CEO',style:TextStyle(fontWeight:FontWeight.w800,fontSize:20)),
     Text(names[selected],style:const TextStyle(fontSize:12,color:Color(0xFF667085)))]),
    actions:[IconButton(tooltip:'Tải lại dữ liệu',onPressed:loading||selected==4?null:refresh,
      icon:const Icon(Icons.refresh)),
     IconButton(tooltip:'Đăng xuất',onPressed:loading?null:logout,icon:const Icon(Icons.logout))]),
   bottomNavigationBar:wide?null:NavigationBar(selectedIndex:selected,onDestinationSelected:choose,
     destinations:List.generate(5,(i)=>NavigationDestination(icon:Icon(symbols[i]),label:names[i]))),
   body:Row(children:[
    if(wide)NavigationRail(selectedIndex:selected,onDestinationSelected:choose,
      labelType:NavigationRailLabelType.all,
      destinations:List.generate(5,(i)=>NavigationRailDestination(
       icon:Icon(symbols[i]),label:Text(names[i])))),
    Expanded(child:SafeArea(child:Column(children:[
      if(error.isNotEmpty)MaterialBanner(content:Text(error),
       actions:[TextButton(onPressed:refresh,child:const Text('Thử lại'))]),
      Expanded(child:RefreshIndicator(onRefresh:refresh,child:content())),
    ]))),
   ]),
  );
 });
 Widget card(String heading,String subtitle,Widget body)=>Card(margin:const EdgeInsets.fromLTRB(14,14,14,0),
  child:Padding(padding:const EdgeInsets.all(16),child:Column(
   crossAxisAlignment:CrossAxisAlignment.start,children:[
     Text(heading,style:const TextStyle(fontSize:18,fontWeight:FontWeight.w800)),
     const SizedBox(height:4),
     Text(subtitle,style:const TextStyle(color:Color(0xFF667085),fontSize:12)),
     const SizedBox(height:12),body,
   ])));
 Widget content(){
  if(selected==4){return ListView(children:[card('Thống kê Website','DL12B · Chưa kết nối',
    const Text('Không hiển thị số liệu mẫu. Analytics sẽ được kết nối và kiểm chứng ở lô DL12B.'))]);}
  if(loading&&((selected==0&&(conversations==null||outsourcing==null||contacts==null))||
    (selected==1&&conversations==null)||(selected==2&&outsourcing==null)||(selected==3&&contacts==null))){
    return const Center(child:CircularProgressIndicator());
  }
  if(selected==0)return overview();
  if(selected==1)return chatList();
  return requests(selected==2?outsourcing:contacts,selected==2);
 }
 Widget overview(){
  if(conversations==null||outsourcing==null||contacts==null){return ListView(children:[
   card('Chưa có dữ liệu','Chỉ hiển thị dữ liệu thật',
    const Text('Kéo xuống hoặc bấm tải lại để kết nối dịch vụ Owner.'))]);}
  final pendingOut=outsourcing!.items.where((r)=>r.pending).length;
  final pendingContacts=contacts!.items.where((r)=>r.pending).length;
  return ListView(children:[
   card('Hoạt động gần đây','Số lượng trong trang đầu mỗi hộp thư, không phải tổng toàn hệ thống',
    Wrap(spacing:12,runSpacing:12,children:[
     metric('Hội thoại',conversations!.items.length),
     metric('Gia công mới',pendingOut),metric('Liên hệ mới',pendingContacts)])),
   card('Gia công mới','Trạng thái mới = chưa xử lý, không có nghĩa chưa đọc',
    Column(children:outsourcing!.items.take(4).map((r)=>caseRow(r,true)).toList())),
   card('Liên hệ gần đây','Yêu cầu mới và đã xử lý',
    Column(children:contacts!.items.take(4).map((r)=>caseRow(r,false)).toList())),
   card('Hội thoại gần đây','Chưa có dữ liệu đã đọc/chưa đọc trên Worker',
    Column(children:conversations!.items.take(4).map(chatRow).toList())),
   const SizedBox(height:24),
  ]);
 }
 Widget metric(String label,int count)=>Container(width:160,padding:const EdgeInsets.all(14),
  decoration:BoxDecoration(color:const Color(0xFFF4EDFA),borderRadius:BorderRadius.circular(12)),
  child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
   Text(count.toString(),style:const TextStyle(fontSize:26,fontWeight:FontWeight.w800)),
   Text(label,style:const TextStyle(fontSize:13))]));
 Widget chatList()=>ListView(children:[
  card('Hội thoại','Đọc lịch sử chat do Futurebook Admin lưu',
   (conversations?.items.isEmpty??true)?const Text('Không có hội thoại.'):
   Column(children:conversations!.items.map(chatRow).toList())),
  if(conversations?.hasMore==true)loadMore(),const SizedBox(height:24)]);
 Widget requests(CeoPage<CeoRequest>? page,bool outsource)=>ListView(children:[
  card(outsource?'Yêu cầu gia công':'Liên hệ & đại lý','Trạng thái lấy trực tiếp từ Admin',
   (page?.items.isEmpty??true)?const Text('Không có yêu cầu.'):
   Column(children:page!.items.map((r)=>caseRow(r,outsource)).toList())),
  if(page?.hasMore==true)loadMore(),const SizedBox(height:24)]);
 Widget loadMore()=>Padding(padding:const EdgeInsets.all(14),child:OutlinedButton(
  onPressed:loading?null:more,child:const Text('Tải trang tiếp')));
 Widget chatRow(CeoConversation r)=>ListTile(contentPadding:EdgeInsets.zero,
  leading:const Icon(Icons.forum_outlined,color:brand),
  title:Text('Phiên ${r.session.length>=8?r.session.substring(0,8):r.session}',
   style:const TextStyle(fontWeight:FontWeight.w700)),
  subtitle:Text("${r.latest.isEmpty?'Chưa có phản hồi':r.latest}\n${dateString(r.updatedAt)}",
   maxLines:3,overflow:TextOverflow.ellipsis),
  isThreeLine:true,trailing:const Icon(Icons.chevron_right),
  onTap:()=>showChat(r));
 Widget caseRow(CeoRequest r,bool outsource)=>ListTile(contentPadding:EdgeInsets.zero,
  leading:Icon(outsource?Icons.handyman_outlined:Icons.mail_outline,color:brand),
  title:Text(r.name,style:const TextStyle(fontWeight:FontWeight.w700)),
  subtitle:Text('${outsource?r.productType:r.customerGroup}\n${dateString(r.createdAt)}',
   maxLines:2,overflow:TextOverflow.ellipsis),
  isThreeLine:true,
  trailing:Chip(label:Text(r.pending?'Mới':'Đã xử lý'),
    backgroundColor:r.pending?const Color(0xFFFFF1DA):const Color(0xFFF4EDFA)),
  onTap:()=>showCase(r,outsource));
 Widget field(String title,String value)=>Padding(padding:const EdgeInsets.only(bottom:14),
  child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
   Text(title,style:const TextStyle(fontSize:12,color:brand,fontWeight:FontWeight.w700)),
   const SizedBox(height:4),
   SelectableText(value.isEmpty?'—':value,style:const TextStyle(fontSize:14,height:1.4)),
  ]));
 void showCase(CeoRequest r,bool outsource)=>showModalBottomSheet<void>(
  context:context,isScrollControlled:true,useSafeArea:true,showDragHandle:true,
  builder:(ctx)=>FractionallySizedBox(heightFactor:.88,child:ListView(
   padding:const EdgeInsets.all(20),children:[
    Text(outsource?'Chi tiết gia công':'Chi tiết liên hệ',
     style:Theme.of(ctx).textTheme.headlineSmall),
    const SizedBox(height:12),
    field('Trạng thái',r.pending?'Mới · chưa xử lý':'Đã xử lý'),
    field('Thời gian',dateString(r.createdAt)),field('Họ tên',r.name),
    field('Email',r.email),field('Số điện thoại',r.phone),
    if(outsource)...[
     field('Loại sản phẩm',r.productType),field('Quy cách',r.specifications),
     field('Số lượng',r.quantity),field('Thời gian mong muốn',r.desiredDate),
     field('Nội dung',r.details),
    ]else...[
     field('Đơn vị',r.company),field('Tỉnh/thành',r.province),
     field('Nhóm khách',r.customerGroup),
     field('Sản phẩm quan tâm',r.interests.join(', ')),field('Nội dung',r.message),
    ],
    const Text('DL12A chỉ đọc. Thao tác xử lý/xóa thực hiện tại Futurebook Admin.',
     style:TextStyle(color:Color(0xFF667085))),
   ])));
 void showChat(CeoConversation r)=>showModalBottomSheet<void>(
  context:context,isScrollControlled:true,useSafeArea:true,showDragHandle:true,
  builder:(ctx)=>FractionallySizedBox(heightFactor:.88,child:FutureBuilder<List<CeoTurn>>(
    future:widget.api.turns(r.session),builder:(context,s){
     if(s.connectionState!=ConnectionState.done)return const Center(child:CircularProgressIndicator());
     if(s.hasError)return Center(child:Text(userError(s.error!)));
     return ListView(padding:const EdgeInsets.all(20),children:[
      Text('Nội dung hội thoại',style:Theme.of(context).textTheme.headlineSmall),
      const Text('Hiển thị 25 lượt đầu; hội thoại dài hơn có thể đọc trong Admin.',
       style:TextStyle(color:Color(0xFF667085),fontSize:12)),
      const SizedBox(height:12),
      for(final turn in (s.data??[]))...[
       field('Khách · ${dateString(turn.createdAt)}',turn.question),
       field('Trợ lý Futurebook',turn.answer.isEmpty?'Chưa có phản hồi':turn.answer),
       const Divider(),
      ],
     ]);
    })));
}
