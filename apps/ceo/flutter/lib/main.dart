import 'package:flutter/material.dart';
import 'ceo_models.dart';
import 'ceo_repository.dart';
import 'ceo_ui_tokens.dart';
import 'ceo_detail_sheet.dart';
import 'ceo_feedback.dart';
import 'ceo_workspace.dart';
import 'push_stub.dart' if (dart.library.js_interop) 'push_web.dart' as push;

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
 final TextEditingController searchController=TextEditingController();
 String requestFilter='all';
 final Map<String,String> confirmedViews={};
 final Set<String> viewWrites={};
 String pushState='unknown';
 bool pushBusy=false;
 // Keep an open notification route synchronized with async Owner data / push state.
 final ValueNotifier<int> alertsVersion=ValueNotifier<int>(0);
 @override void dispose(){searchController.dispose();alertsVersion.dispose();super.dispose();}
 String? initialTarget;
 int? initialTab;
 @override void initState(){
  super.initState();
  final tab=Uri.base.queryParameters['tab'],id=Uri.base.queryParameters['id'];
  final tabNumber=switch(tab){'chat'=>1,'outsourcing'=>2,'contact'=>3,_=>null};
  if(tabNumber!=null&&id!=null&&
   (tabNumber==1?RegExp(r'^[a-f0-9]{36}$').hasMatch(id):
    RegExp(r'^[0-9a-fA-F-]{36}$').hasMatch(id))){
   selected=tabNumber;initialTab=tabNumber;initialTarget=id;
  }
  Future.microtask(refresh);
  Future.microtask(loadPushState);
 }
 Future<void> loadPushState()async{
  final status=await push.status();
  // A slower initial lookup must not overwrite a user-initiated change.
  if(mounted&&!pushBusy){
   setState(()=>pushState=status);
   alertsVersion.value++;
  }
 }
 Future<void> togglePush()async{
  if(pushBusy||pushState=='unknown')return;
  // Start the browser permission prompt within the user gesture, no awaits first.
  final action=pushState=='enabled'?push.disable():push.enable();
  setState(()=>pushBusy=true);
  alertsVersion.value++;
  try{
   final status=await action;
   if(!mounted)return;
   setState(()=>pushState=status);
   final message=switch(status){
    'unsupported'=>'Trình duyệt hoặc thiết bị không hỗ trợ Web Push.',
    'ios_install'=>'Trên iPhone, thêm CEO vào Màn hình chính rồi mở từ biểu tượng ứng dụng.',
    'denied'=>'Quyền thông báo đã bị chặn trong trình duyệt.',
    'login_required'=>'Phiên Owner hết hạn. Vui lòng đăng nhập lại.',
    'forbidden'=>'Tài khoản không có quyền Owner.',
    'service_error'=>'Chưa kết nối được Web Push. Kiểm tra cấu hình server.',
    _=>''
   };
   if(message.isNotEmpty)setState(()=>error=message);
  }catch(_){if(mounted)setState(()=>error='Chưa kết nối được dịch vụ Web Push.');}
  finally{if(mounted){
   setState(()=>pushBusy=false);
   alertsVersion.value++;
  }}
 }
 int countNew(int tab){
  if(tab==2)return outsourcing?.items.where((r)=>r.unread).length??0;
  if(tab==3)return contacts?.items.where((r)=>r.unread).length??0;
  return 0;
 }
 Widget redCountBadge(int count,Widget icon){
  if(count<=0)return icon;
  return Badge(
   backgroundColor:ceoBadgeRed,textColor:Colors.white,
   alignment:Alignment.topRight,offset:const Offset(5,-5),
   label:Text(count>99?'99+':'$count',
    style:const TextStyle(fontSize:10,fontWeight:FontWeight.w700)),
   child:icon);
 }
 Widget tabIcon(int tab)=>redCountBadge(countNew(tab),Icon(symbols[tab]));
 // Badge counts are real, unhandled AND unseen Owner requests in loaded pages.
 // Chat has no read receipts; never invent a chat-unread count.
 Widget bellIcon()=>redCountBadge(
  countNew(2)+countNew(3),
  Icon(pushState=='enabled'?Icons.notifications_active:
   pushState=='denied'?Icons.notifications_off_outlined:
   Icons.notifications_none_outlined));

 String get pushStatusText=>switch(pushState){
  'enabled'=>'Đang bật trên thiết bị này.',
  'disabled'=>'Đang tắt. Bật để nhận thông báo khi có khách mới.',
  'denied'=>'Trình duyệt đã chặn quyền thông báo.',
  'ios_install'=>'iPhone: thêm CEO vào Màn hình chính rồi mở từ ứng dụng.',
  'login_required'=>'Phiên Owner hết hạn. Vui lòng đăng nhập lại.',
  'forbidden'=>'Tài khoản hiện tại không có quyền Owner.',
  'service_error'=>'Chưa kết nối được máy chủ Web Push.',
  'unsupported'=>'Trình duyệt hoặc thiết bị không hỗ trợ Web Push.',
  _=>'Đang kiểm tra trạng thái thông báo...',
 };

 // Bell opens the Owner's new-request inbox. Push permission is managed
 // separately here, so viewing requests never silently unsubscribes.
 void openNotifications(){
  showModalBottomSheet<void>(
   context:context,isScrollControlled:true,useSafeArea:true,
   sheetAnimationStyle:ceoDetailSheetMotion(context),
   builder:(sheetContext)=>ValueListenableBuilder<int>(
    valueListenable:alertsVersion,
    builder:(sheetContext,_,__){
     final newOut=outsourcing?.items.where((r)=>r.unread).toList()??<CeoRequest>[];
     final newContacts=contacts?.items.where((r)=>r.unread).toList()??<CeoRequest>[];
     final total=newOut.length+newContacts.length;
     void openRequest(CeoRequest request,bool isOutsourcing){
      Navigator.of(sheetContext).pop();
      Future.delayed(const Duration(milliseconds:250),(){
       if(mounted)showCase(request,isOutsourcing);
      });
     }
     return FractionallySizedBox(heightFactor:.78,child:Column(children:[
      const CeoSheetHeader(title:'Thông báo & yêu cầu mới'),
      Padding(padding:const EdgeInsets.fromLTRB(12,8,12,4),
       child:Card(margin:EdgeInsets.zero,color:const Color(0xFFF4EDFA),
        child:ListTile(
         leading:const Icon(Icons.notifications_active_outlined,color:brand),
         title:const Text('Web Push trên thiết bị',
          style:TextStyle(fontWeight:FontWeight.w700,fontSize:14)),
         subtitle:Text(pushStatusText,style:const TextStyle(fontSize:12)),
         trailing:pushBusy||pushState=='unknown'?
          const SizedBox(width:24,height:24,
           child:CircularProgressIndicator(strokeWidth:2)):
          TextButton(
           onPressed:togglePush, // Preserve the browser user gesture.
           child:Text(pushState=='enabled'?'Tắt':'Bật')),
        ))),
      Expanded(child:ListView(padding:const EdgeInsets.fromLTRB(12,8,12,20),children:[
       ListTile(
        leading:const Icon(Icons.mark_email_unread_outlined,color:brand),
        title:Text('$total yêu cầu chưa xem',
         style:const TextStyle(fontWeight:FontWeight.w800,fontSize:16)),
        subtitle:const Text('Đếm yêu cầu Mới chưa xem trong các trang đã tải; xem không đồng nghĩa đã xử lý.'),
       ),
       if(total==0)
        const Padding(padding:EdgeInsets.all(16),
         child:Text('Không còn yêu cầu Mới chưa xem trong danh sách đã tải.')),
       for(final item in newOut)
        ListTile(
         leading:const Icon(Icons.handyman_outlined,color:brand),
         title:Text('Gia công · ${item.name}'),
         subtitle:Text(dateString(item.createdAt)),
         trailing:const Icon(Icons.chevron_right),
         onTap:()=>openRequest(item,true)),
       for(final item in newContacts)
        ListTile(
         leading:const Icon(Icons.mail_outline,color:brand),
         title:Text('Liên hệ · ${item.name}'),
         subtitle:Text(dateString(item.createdAt)),
         trailing:const Icon(Icons.chevron_right),
         onTap:()=>openRequest(item,false)),
       const Divider(),
       ListTile(
        title:const Text('Xem tất cả yêu cầu gia công'),
        trailing:const Icon(Icons.arrow_forward_ios,size:16),
        onTap:(){Navigator.of(sheetContext).pop();choose(2);}),
       ListTile(
        title:const Text('Xem tất cả liên hệ'),
        trailing:const Icon(Icons.arrow_forward_ios,size:16),
        onTap:(){Navigator.of(sheetContext).pop();choose(3);}),
      ])),
     ]));
    }),
  );
 }

 Future<void> openDeepLinkedItem()async{
  final id=initialTarget,tab=initialTab;
  initialTarget=null;initialTab=null;
  if(!mounted||id==null||tab==null)return;
  if(tab==1){
   showChat(CeoConversation(session:id,createdAt:'',updatedAt:'',
    latest:'',messageCount:0));
   return;
  }
  try{
   CeoPage<CeoRequest>? current=tab==2?outsourcing:contacts;
   for(var page=1;page<=5;page++){
    current??=tab==2?await widget.api.outsourcingRequests(page):
      await widget.api.contactRequests(page);
    for(final item in current.items){
     if(item.id.toLowerCase()==id.toLowerCase()){
      if(mounted)showCase(item,tab==2);
      return;
     }
    }
    if(!current.hasMore)break;
    current=tab==2?await widget.api.outsourcingRequests(page+1):
      await widget.api.contactRequests(page+1);
   }
   if(mounted)setState(()=>error='Yêu cầu này không còn trong danh sách hiện tại.');
  }catch(e){if(mounted)setState(()=>error=userError(e));}
 }

 CeoPage<CeoRequest> applyConfirmedViews(CeoPage<CeoRequest> page,String kind)=>
  CeoPage(page.items.map((item){
   final at=confirmedViews['$kind:${item.id}'];
   return at!=null&&item.viewedAt==null?item.markViewedAt(at):item;
  }).toList(growable:false),page.page,page.hasMore);
 Future<void> markViewed(CeoRequest request,bool outsource)async{
  final kind=outsource?'outsourcing':'contact';
  final key='$kind:${request.id}';
  if(!request.unread||viewWrites.contains(key)||confirmedViews.containsKey(key))return;
  viewWrites.add(key);
  try{
   final viewedAt=await widget.api.markViewed(kind,request.id);
   if(!mounted)return;
   confirmedViews[key]=viewedAt;
   setState((){
    if(outsource&&outsourcing!=null)outsourcing=applyConfirmedViews(outsourcing!,kind);
    if(!outsource&&contacts!=null)contacts=applyConfirmedViews(contacts!,kind);
   });
   alertsVersion.value++;
  }catch(e){if(mounted)setState(()=>error=userError(e));}
  finally{viewWrites.remove(key);}
 }
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
      outsourcing=applyConfirmedViews(result[1] as CeoPage<CeoRequest>,'outsourcing');
      contacts=applyConfirmedViews(result[2] as CeoPage<CeoRequest>,'contact');
    });}
   }else if(tabAtStart==1){final v=await widget.api.conversations();
    if(mounted)setState(()=>conversations=v);}
   else if(tabAtStart==2){final v=await widget.api.outsourcingRequests();
    if(mounted)setState(()=>outsourcing=applyConfirmedViews(v,'outsourcing'));}
   else if(tabAtStart==3){final v=await widget.api.contactRequests();
    if(mounted)setState(()=>contacts=applyConfirmedViews(v,'contact'));}
  }catch(e){if(mounted)setState(()=>error=userError(e));}
  finally{
   endLoad(tabAtStart);
   if(mounted)alertsVersion.value++;
  }
 }
 void endLoad(int previousTab){
  if(!mounted)return;
  final reload=selected!=4&&pendingRefresh&&selected!=previousTab;
  pendingRefresh=false;
  setState(()=>loading=false);
  if(reload){Future.microtask(refresh);}
  else if(initialTarget!=null&&selected==previousTab){
   WidgetsBinding.instance.addPostFrameCallback((_){if(mounted)openDeepLinkedItem();});
  }
 }
 void choose(int value){
  if(value==selected)return;
  setState((){selected=value;error='';requestFilter='all';searchController.clear();});
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
    if(mounted)setState(()=>outsourcing=applyConfirmedViews(CeoPage([...outsourcing!.items,...v.items],v.page,v.hasMore),'outsourcing'));
   }else if(selected==3&&contacts?.hasMore==true){
    final v=await widget.api.contactRequests(contacts!.page+1);
    if(mounted)setState(()=>contacts=applyConfirmedViews(CeoPage([...contacts!.items,...v.items],v.page,v.hasMore),'contact'));
   }
  }catch(e){if(mounted)setState(()=>error=userError(e));}
  finally{
   endLoad(tabAtStart);
   if(mounted)alertsVersion.value++;
  }
 }
 Future<void> logout()async{
  if(loading)return;
  setState(()=>loading=true);
  try{
   try{await push.disable();}catch(_){} // revoke device push when logging out
   await widget.api.signOut();if(mounted)widget.onSignOut();
  }
  catch(e){if(mounted)setState(()=>error=userError(e));}
  finally{if(mounted)setState(()=>loading=false);}
 }
 @override Widget build(BuildContext context)=>LayoutBuilder(builder:(context,box){
  final wide=box.maxWidth>=850;
  return Scaffold(
   appBar:AppBar(backgroundColor:Colors.white,title:Column(crossAxisAlignment:CrossAxisAlignment.start,
    children:[const Text('Futurebook CEO',style:TextStyle(fontWeight:FontWeight.w800,fontSize:20)),
     Text(names[selected],style:const TextStyle(fontSize:12,color:Color(0xFF667085)))]),
    actions:[
     IconButton(
      tooltip:'Xem thông báo và yêu cầu mới',
      onPressed:openNotifications,
      icon:bellIcon()),
     IconButton(tooltip:'Tải lại dữ liệu',onPressed:loading||selected==4?null:refresh,
      icon:const Icon(Icons.refresh)),
     IconButton(tooltip:'Đăng xuất',onPressed:loading?null:logout,icon:const Icon(Icons.logout))]),
   bottomNavigationBar:wide?null:NavigationBar(selectedIndex:selected,onDestinationSelected:choose,
     labelBehavior:box.maxWidth<400?NavigationDestinationLabelBehavior.onlyShowSelected:
      NavigationDestinationLabelBehavior.alwaysShow,
     destinations:List.generate(5,(i)=>NavigationDestination(icon:tabIcon(i),label:names[i]))),
   body:Stack(children:[
    Row(children:[
     if(wide)NavigationRail(selectedIndex:selected,onDestinationSelected:choose,
       labelType:NavigationRailLabelType.all,
       destinations:List.generate(5,(i)=>NavigationRailDestination(
        icon:tabIcon(i),label:Text(names[i])))),
     Expanded(child:SafeArea(child:Center(child:ConstrainedBox(
      constraints:const BoxConstraints(maxWidth:1180),
      child:RefreshIndicator(onRefresh:refresh,child:content()))))),
    ]),
    if(error.isNotEmpty)Positioned(top:12,right:12,left:wide?null:12,
      child:CeoErrorToast(
       key:ValueKey(error),message:error,onRetry:refresh,
       onClose:(){if(mounted)setState(()=>error='');})),
   ]),
  );
 });

 // All CEO screens share the same panel, search and row primitives.
 Widget content(){
  if(selected==4){
   return ListView(physics:const AlwaysScrollableScrollPhysics(),children:[
    const CeoPanel(title:'Thống kê Website',subtitle:'DL12B · Chưa kết nối',
     icon:Icons.bar_chart_outlined,
     child:CeoEmptyResult(title:'Chưa có dữ liệu thống kê',
      detail:'Chỉ hiển thị số liệu sau khi kết nối và xác minh dữ liệu thực.',
      icon:Icons.insights_outlined)),
   ]);
  }
  if(loading&&((selected==0&&(conversations==null||outsourcing==null||contacts==null))||
   (selected==1&&conversations==null)||(selected==2&&outsourcing==null)||
   (selected==3&&contacts==null))){
   return const Center(child:CircularProgressIndicator());
  }
  if(selected==0)return overview();
  if(selected==1)return chatList();
  return requests(selected==2?outsourcing:contacts,selected==2);
 }

 Widget overview(){
  if(conversations==null||outsourcing==null||contacts==null){
   return ListView(physics:const AlwaysScrollableScrollPhysics(),children:[
    const CeoPanel(title:'Chưa có dữ liệu',subtitle:'Chỉ hiển thị dữ liệu thật',
     icon:Icons.cloud_off_outlined,
     child:CeoEmptyResult(title:'Chưa tải được thông tin',
      detail:'Kéo xuống hoặc bấm tải lại để kết nối dịch vụ Owner.')),
   ]);
  }
  final pendingOut=outsourcing!.items.where((r)=>r.pending).length;
  final pendingContacts=contacts!.items.where((r)=>r.pending).length;
  return ListView(physics:const AlwaysScrollableScrollPhysics(),children:[
   CeoPanel(title:'Hoạt động gần đây',
    subtitle:'Số liệu trong trang đầu mỗi danh sách, không phải tổng hệ thống',
    icon:Icons.space_dashboard_outlined,
    child:LayoutBuilder(builder:(context,box){
     final cols=box.maxWidth>=660?3:box.maxWidth>=260?2:1;
     const gap=10.0;
     final width=(box.maxWidth-gap*(cols-1))/cols;
     final items=<Widget>[
      CeoMetricCard(label:'Hội thoại',count:conversations!.items.length,icon:Icons.forum_outlined),
      CeoMetricCard(label:'Gia công chưa xử lý',count:pendingOut,icon:Icons.handyman_outlined),
      CeoMetricCard(label:'Liên hệ chưa xử lý',count:pendingContacts,icon:Icons.contact_mail_outlined),
     ];
     return Wrap(spacing:gap,runSpacing:gap,children:[
      for(var i=0;i<items.length;i++)
       SizedBox(width:cols==2&&i==2?box.maxWidth:width,child:items[i]),
     ]);
    })),
   CeoPanel(title:'Gia công mới',subtitle:'Yêu cầu gần nhất trong danh sách đã tải',
    icon:Icons.handyman_outlined,
    child:outsourcing!.items.isEmpty?
     const CeoEmptyResult(title:'Chưa có yêu cầu gia công',detail:'Khi có yêu cầu mới, dữ liệu sẽ hiển thị tại đây.'):
     Column(children:outsourcing!.items.take(3).map((r)=>caseRow(r,true)).toList())),
   CeoPanel(title:'Liên hệ gần đây',subtitle:'Đã xem và chưa xử lý là hai trạng thái riêng biệt',
    icon:Icons.contact_mail_outlined,
    child:contacts!.items.isEmpty?
     const CeoEmptyResult(title:'Chưa có liên hệ',detail:'Yêu cầu từ Website sẽ xuất hiện tại đây.'):
     Column(children:contacts!.items.take(3).map((r)=>caseRow(r,false)).toList())),
   CeoPanel(title:'Hội thoại gần đây',subtitle:'Lịch sử chatbot đang lưu trong Admin',
    icon:Icons.forum_outlined,
    child:conversations!.items.isEmpty?
     const CeoEmptyResult(title:'Chưa có hội thoại',detail:'Không có phiên chat trong dữ liệu đã tải.'):
     Column(children:conversations!.items.take(3).map(chatRow).toList())),
   const SizedBox(height:24),
  ]);
 }

 Widget chatList(){
  final q=searchController.text.trim().toLowerCase();
  final visible=(conversations?.items??<CeoConversation>[]).where((r)=>
   q.isEmpty||r.session.toLowerCase().contains(q)||
    r.latest.toLowerCase().contains(q)).toList();
  return ListView(physics:const AlwaysScrollableScrollPhysics(),children:[
   CeoPanel(title:'Hội thoại khách hàng',
    subtitle:'Tìm trong các phiên đã tải · Chỉ đọc lịch sử chatbot',
    icon:Icons.forum_outlined,
    child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
     CeoSearchBox(controller:searchController,
      hint:'Tìm nội dung hoặc mã phiên chat',
      onChanged:(_)=>setState((){})),
     const SizedBox(height:12),
     if(visible.isEmpty)
      CeoEmptyResult(title:q.isNotEmpty?'Không tìm thấy hội thoại':'Chưa có hội thoại',
       detail:q.isNotEmpty?'Thử từ khóa khác hoặc tải thêm dữ liệu.':
        'Chưa có hội thoại trong danh sách hiện tại.',
       icon:Icons.chat_bubble_outline),
     for(final item in visible)chatRow(item),
    ])),
   if(conversations?.hasMore==true)loadMore(),
   const SizedBox(height:24),
  ]);
 }

 bool matchesRequest(CeoRequest item,bool outsource){
  if(requestFilter=='new'&&!item.pending)return false;
  if(requestFilter=='handled'&&item.pending)return false;
  final q=searchController.text.trim().toLowerCase();
  if(q.isEmpty)return true;
  return <String>[
   item.name,item.email,item.phone,item.company,item.province,item.customerGroup,
   item.productType,item.specifications,item.quantity,item.details,item.message,
   ...item.interests,
  ].join(' ').toLowerCase().contains(q);
 }

 Widget requests(CeoPage<CeoRequest>? page,bool outsource){
  final visible=(page?.items??<CeoRequest>[])
   .where((item)=>matchesRequest(item,outsource)).toList();
  return ListView(physics:const AlwaysScrollableScrollPhysics(),children:[
   CeoPanel(title:outsource?'Yêu cầu gia công':'Liên hệ & đại lý',
    subtitle:'Tìm và lọc trong danh sách đã tải · Trạng thái lấy từ Admin',
    icon:outsource?Icons.handyman_outlined:Icons.contact_mail_outlined,
    child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
     CeoSearchBox(controller:searchController,
      hint:outsource?'Tìm tên khách, sản phẩm, quy cách':'Tìm khách, công ty, email, tỉnh thành',
      onChanged:(_)=>setState((){})),
     const SizedBox(height:12),
     Wrap(spacing:8,runSpacing:8,children:[
      for(final pair in const <(String,String)>[
       ('all','Tất cả'),('new','Mới'),('handled','Đã xử lý')])
       ChoiceChip(
        key:ValueKey('ceo-filter-${pair.$1}'),
        label:Text(pair.$2),
        selected:requestFilter==pair.$1,
        selectedColor:ceoLavender,
        labelStyle:TextStyle(fontSize:13,fontWeight:FontWeight.w600,
         color:requestFilter==pair.$1?ceoPurple:ceoInk),
        onSelected:(_)=>setState(()=>requestFilter=pair.$1)),
     ]),
     const SizedBox(height:8),
     if(visible.isEmpty)
      CeoEmptyResult(title:page?.items.isEmpty??true?'Chưa có yêu cầu':'Không tìm thấy yêu cầu',
       detail:page?.items.isEmpty??true?
        'Danh sách hiện chưa có yêu cầu khách hàng.':
        'Thử đổi bộ lọc hoặc từ khóa; tìm kiếm chỉ áp dụng cho trang đã tải.'),
     for(final item in visible)caseRow(item,outsource),
    ])),
   if(page?.hasMore==true)loadMore(),
   const SizedBox(height:24),
  ]);
 }

 Widget loadMore()=>Padding(
  padding:const EdgeInsets.fromLTRB(12,12,12,8),
  child:OutlinedButton(onPressed:loading?null:more,
   child:const Text('Tải trang tiếp')));

 Widget chatRow(CeoConversation item)=>_listRow(
  icon:Icons.chat_bubble_outline,
  title:'Phiên ${item.session.length>=8?item.session.substring(0,8):item.session}',
  subtitle:item.latest.isEmpty?'Chưa có nội dung phản hồi':item.latest,
  meta:dateString(item.updatedAt),
  trailing:item.messageCount>0?
   CeoStatusPill(text:'${item.messageCount} lượt'):null,
  onTap:()=>showChat(item));

 Widget caseRow(CeoRequest item,bool outsource)=>_listRow(
  icon:outsource?Icons.handyman_outlined:Icons.person_outline,
  title:item.name.isEmpty?'Khách chưa có tên':item.name,
  subtitle:outsource?
   (item.productType.isEmpty?'Yêu cầu gia công':item.productType):
   (item.company.isNotEmpty?item.company:
    item.customerGroup.isEmpty?'Liên hệ từ Website':item.customerGroup),
  meta:dateString(item.createdAt),
  trailing:Wrap(spacing:5,runSpacing:4,children:[
   if(item.unread)const CeoStatusPill(text:'Chưa xem',highlighted:true),
   CeoStatusPill(text:item.pending?'Mới':'Đã xử lý',highlighted:item.pending),
  ]),
  onTap:()=>showCase(item,outsource));

 Widget _listRow({required IconData icon,required String title,
  required String subtitle,required String meta,required VoidCallback onTap,
  Widget? trailing}){
  return Padding(padding:const EdgeInsets.only(bottom:5),
   child:Material(color:Colors.transparent,child:InkWell(
    borderRadius:BorderRadius.circular(12),onTap:onTap,
    child:Padding(padding:const EdgeInsets.symmetric(horizontal:3,vertical:11),
     child:Row(crossAxisAlignment:CrossAxisAlignment.center,children:[
      Container(width:42,height:42,
       decoration:BoxDecoration(color:ceoLavender.withValues(alpha:.65),
        borderRadius:BorderRadius.circular(12)),
       child:Icon(icon,color:ceoPurple,size:21)),
      const SizedBox(width:11),
      Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
       Text(title,maxLines:1,overflow:TextOverflow.ellipsis,
        style:const TextStyle(fontSize:14,fontWeight:FontWeight.w700,color:ceoInk)),
       const SizedBox(height:3),
       Text(subtitle,maxLines:2,overflow:TextOverflow.ellipsis,
        style:const TextStyle(fontSize:12.5,color:ceoMuted,height:1.3)),
       const SizedBox(height:5),
       if(meta.isNotEmpty)Text(meta,maxLines:1,overflow:TextOverflow.ellipsis,
        style:const TextStyle(fontSize:11.5,color:ceoMuted)),
       if(trailing!=null)...[
        const SizedBox(height:7),
        Align(alignment:Alignment.centerLeft,child:trailing),
       ],
      ])),
      const SizedBox(width:5),
      const Icon(Icons.chevron_right,color:ceoMuted,size:19),
     ])),
   )));
 }

 Widget field(String title,String value)=>Padding(
  padding:const EdgeInsets.only(bottom:13),
  child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   Text(title,style:const TextStyle(fontSize:12,
    color:ceoMuted,fontWeight:FontWeight.w700)),
   const SizedBox(height:4),
   SelectableText(value.trim().isEmpty?'—':value,
    style:const TextStyle(fontSize:14,height:1.5,color:ceoInk)),
  ]));

 // Desktop uses a bounded dialog, mobile a keyboard-safe full-width sheet.
 void openDetail(Widget Function(BuildContext) builder){
  if(MediaQuery.sizeOf(context).width>=850){
   showDialog<void>(context:context,builder:(dialogContext)=>Dialog(
    clipBehavior:Clip.antiAlias,
    insetPadding:const EdgeInsets.symmetric(horizontal:24,vertical:28),
    child:SizedBox(width:860,height:MediaQuery.sizeOf(dialogContext).height*.84,
     child:builder(dialogContext))));
  }else{
   showModalBottomSheet<void>(
    context:context,isScrollControlled:true,useSafeArea:true,showDragHandle:false,
    sheetAnimationStyle:ceoDetailSheetMotion(context),
    builder:(sheetContext)=>FractionallySizedBox(
     heightFactor:.94,child:builder(sheetContext)));
  }
 }

 void showCase(CeoRequest item,bool outsource){
  final kind=outsource?'outsourcing':'contact';
  openDetail((ctx)=>ValueListenableBuilder<int>(
   valueListenable:alertsVersion,
   builder:(ctx,_,__)=>Column(children:[
   CeoSheetHeader(title:outsource?'Chi tiết gia công':'Chi tiết liên hệ'),
   Expanded(child:ListView(padding:const EdgeInsets.all(14),children:[
    CeoDetailGroup(title:'Thông tin yêu cầu',icon:Icons.assignment_outlined,
     children:[
      Row(children:[
       Expanded(child:field('Trạng thái',item.pending?'Mới · chưa xử lý':'Đã xử lý')),
       const SizedBox(width:8),
       Expanded(child:field('Đã xem',item.viewedAt!=null||
        confirmedViews.containsKey('$kind:${item.id}')?'Đã xem':'Chưa xem')),
      ]),
      field('Thời gian',dateString(item.createdAt)),
     ]),
    const SizedBox(height:12),
    CeoDetailGroup(title:'Thông tin khách hàng',icon:Icons.person_outline,
     children:[
      field('Họ tên',item.name),
      field('Email',item.email),
      field('Số điện thoại',item.phone),
      if(!outsource)...[
       field('Đơn vị',item.company),field('Tỉnh/thành',item.province),
       field('Nhóm khách',item.customerGroup),
      ],
     ]),
    const SizedBox(height:12),
    CeoDetailGroup(title:outsource?'Chi tiết gia công':'Nhu cầu liên hệ',
     icon:outsource?Icons.handyman_outlined:Icons.description_outlined,
     children:outsource?[
      field('Loại sản phẩm',item.productType),
      field('Quy cách',item.specifications),
      field('Số lượng',item.quantity),
      field('Thời gian mong muốn',item.desiredDate),
      field('Nội dung',item.details),
     ]:[
      field('Sản phẩm quan tâm',item.interests.join(', ')),
      field('Nội dung',item.message),
     ]),
    const SizedBox(height:12),
    const Text('Mở xem chỉ đánh dấu đã xem; xử lý/xóa thực hiện tại Futurebook Admin.',
     style:TextStyle(color:ceoMuted,fontSize:12.5,height:1.4)),
    const SizedBox(height:18),
   ])),
  ])));
  if(item.unread)Future.microtask(()=>markViewed(item,outsource));
 }

 void showChat(CeoConversation item){
  openDetail((ctx)=>Column(children:[
   const CeoSheetHeader(title:'Nội dung hội thoại'),
   Expanded(child:FutureBuilder<List<CeoTurn>>(
    future:widget.api.turns(item.session),
    builder:(context,s){
     if(s.connectionState!=ConnectionState.done){
      return const Center(child:CircularProgressIndicator());
     }
     if(s.hasError){
      return CeoEmptyResult(title:'Không tải được hội thoại',detail:userError(s.error!),
       icon:Icons.error_outline);
     }
     final turns=s.data??<CeoTurn>[];
     return ListView(padding:const EdgeInsets.all(16),children:[
      Container(padding:const EdgeInsets.all(12),
       decoration:BoxDecoration(color:ceoLavender,
        borderRadius:BorderRadius.circular(12)),
       child:const Text('Lịch sử chatbot · Chỉ hiển thị 25 lượt đầu. Hội thoại dài hơn xem trong Admin.',
        style:TextStyle(fontSize:12.5,color:ceoInk,height:1.4))),
      const SizedBox(height:18),
      if(turns.isEmpty)const CeoEmptyResult(title:'Chưa có tin nhắn',
       detail:'Phiên này chưa có lượt hội thoại trong dữ liệu trả về.',
       icon:Icons.chat_outlined),
      for(final turn in turns)...[
       CeoChatBubble(text:turn.question,time:dateString(turn.createdAt),assistant:false),
       const SizedBox(height:12),
       CeoChatBubble(text:turn.answer,time:'',assistant:true),
       const SizedBox(height:18),
      ],
     ]);
    })),
  ]));
 }
}
