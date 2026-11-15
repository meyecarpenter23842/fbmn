// ignore_for_file: prefer_interpolation_to_compose_strings, curly_braces_in_flow_control_structures, avoid_renaming_method_parameters, prefer_null_aware_operators
import 'dart:async';
import 'package:flutter/material.dart';
import 'ceo_repository.dart';
import 'ceo_stats_models.dart';
import 'ceo_ui_tokens.dart';
import 'ceo_workspace.dart';
import 'gsc_oauth_navigation_stub.dart' if (dart.library.js_interop) 'gsc_oauth_navigation_web.dart' as oauth_nav;

/// Three lazy-load panels share the existing Statistics subtab rail.
/// Never contains a Google credential and never sends a Google Ads mutation.
class CeoAdsPanel extends StatefulWidget{
 final CeoRepository api;
 final int kind;
 final String period;
 final CeoMarketingOverview? marketing;
 const CeoAdsPanel({super.key,required this.api,required this.kind,
  required this.period,this.marketing});
 @override State<CeoAdsPanel> createState()=>CeoAdsPanelState();
}
class CeoAdsPanelState extends State<CeoAdsPanel>{
 final seed=TextEditingController(text:'tập học sinh\nvở học sinh\nsổ tay');
 final geoNames=TextEditingController(text:'Ho Chi Minh City');
 final draftName=TextEditingController();
 final budget=TextEditingController();
 final landing=TextEditingController(text:'https://www.fbmn.vn/san-pham');
 final negatives=TextEditingController();
 String matchType='PHRASE';
 String status='',error='',notice='',customer='',currency='',zone='';
 bool loading=true,searching=false,saving=false;
 int generation=0;
 List<Map<String,dynamic>> suggestions=[],keywordRows=[],campaignRows=[],draftRows=[];
 List<String> chosenGeos=[];
 Map<String,dynamic>? performance;
 @override void initState(){super.initState();WidgetsBinding.instance.addPostFrameCallback((_){
  if(mounted)unawaited(reload());
 });}
 @override void didUpdateWidget(covariant CeoAdsPanel old){
  super.didUpdateWidget(old);
  if(old.kind!=widget.kind||old.period!=widget.period)unawaited(reload());
 }
 @override void dispose(){
  generation++;
  for(final c in [seed,geoNames,draftName,budget,landing,negatives]){c.dispose();}
  super.dispose();
 }
 List<String> lines(String input)=>input.split(RegExp(r'[\n,;]'))
  .map((s)=>s.trim()).where((s)=>s.isNotEmpty).toSet().take(20).toList();
 Map<String,dynamic> obj(Object? v)=>v is Map?
  Map<String,dynamic>.from(v):<String,dynamic>{};
 List<Map<String,dynamic>> objects(Object? v)=>v is List?
  v.whereType<Map>().map((e)=>Map<String,dynamic>.from(e)).toList():[];
 String? number(Object? v,[int decimals=0]){
  if(v==null)return null;
  final n=v is num?v:num.tryParse(v.toString());
  if(n==null||!n.isFinite)return null;
  return decimals==0?n.toStringAsFixed(0):n.toStringAsFixed(decimals);
 }
 String value(Object? v,[int decimals=0])=>number(v,decimals)??'—';
 String money(Object? v)=>v==null?'—':(number(v,2)??'—')+' '+currency;
 String get title=>switch(widget.kind){
  0=>'ADS01 · Nghiên cứu từ khóa',
  1=>'ADS02 · Chiến dịch quảng cáo',
  _=>'ADS03 · Hiệu quả quảng cáo'};
 String get subtitle=>switch(widget.kind){
  0=>'Google Ads Keyword Planner · dữ liệu lịch sử/ước tính',
  1=>'Chiến dịch thật và bản nháp Search Ads B2B',
  _=>'Chi phí thật từ Google Ads; lead theo nguồn PostHog độc lập'};
 String humanError(Object e){
  if(e is CeoApiException){
   return switch(e.status){
    401=>'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    403=>'Tài khoản chưa được cấp quyền Google Ads.',
    409=>'Quyền OAuth đã hết hạn. Owner cần kết nối lại.',
    429=>'Google Ads giới hạn lượt truy vấn. Vui lòng thử lại sau.',
    400=>'Thông tin tìm kiếm hoặc bản nháp chưa hợp lệ.',
    _=>'Không đọc được Google Ads. Kiểm tra API, quyền hoặc kết nối.'};
  }
  return 'Không thể tải Google Ads. Vui lòng thử lại.';
 }
 Future<void> reload()async{
  final id=++generation;
  if(mounted)setState((){loading=true;error='';notice='';});
  try{
   final info=await widget.api.adsStatus();
   if(!mounted||id!=generation)return;
   final nextStatus=info['status'] is String?info['status'] as String:'unconfigured';
   setState((){
    status=nextStatus;customer=(info['customerId']??'').toString();
    currency=(info['currency']??'').toString();
    zone=(info['timeZone']??'').toString();
    loading=false;
    keywordRows=[];campaignRows=[];draftRows=[];suggestions=[];performance=null;
   });
   if(status!='ready')return;
   if(widget.kind==1){
    final results=await Future.wait([
     widget.api.adsReport('campaigns'),widget.api.adsDrafts()]);
    if(mounted&&id==generation)setState((){
     campaignRows=objects(obj(results[0])['result']);
     draftRows=objects(results[1]);loading=false;
    });
   }else if(widget.kind==0){
    final rows=await widget.api.adsDrafts();
    if(mounted&&id==generation)setState(()=>draftRows=objects(rows));
   }else{
    final res=await widget.api.adsReport('performance',period:widget.period);
    if(mounted&&id==generation)setState(()=>performance=obj(res['result']));
   }
  }catch(e){
   if(mounted&&id==generation)setState((){loading=false;error=humanError(e);});
  }
 }
 Future<void> lookupGeos()async{
  final names=lines(geoNames.text);
  if(names.isEmpty)return;
  setState((){searching=true;error='';notice='';suggestions=[];});
  try{
   final res=await widget.api.adsReport('geo',names:names.take(10).toList());
   if(mounted)setState((){
    suggestions=objects(res['result']);searching=false;
    notice=suggestions.isEmpty?'Google Ads chưa trả về khu vực khớp.':'Chọn khu vực đúng từ Google Ads.';
   });
  }catch(e){if(mounted)setState((){searching=false;error=humanError(e);});}
 }
 Future<void> lookupKeywords(String view)async{
  final words=lines(seed.text);
  if(words.isEmpty||chosenGeos.isEmpty){
   setState(()=>error='Nhập từ khóa và chọn ít nhất một khu vực Google Ads.');return;
  }
  setState((){searching=true;error='';notice='';});
  try{
   final res=await widget.api.adsReport(view,
    words:words,geos:chosenGeos);
   final payload=obj(res['result']);
   if(mounted)setState((){
    keywordRows=objects(payload['items']);searching=false;
    notice=keywordRows.isEmpty?'Google Ads không trả dữ liệu theo bộ lọc hiện tại.':
     'Dữ liệu dự báo/lịch sử, không phải lượt nhấp hay CPC thực chi.';
   });
  }catch(e){if(mounted)setState((){searching=false;error=humanError(e);});}
 }
 Future<void> createDraft(Map<String,dynamic> body)async{
  if(!widget.api.grantedScopes.contains('ceo.ads.draft')){
   setState(()=>error='Chưa được cấp quyền chuẩn bị bản nháp Ads.');return;
  }
  setState((){saving=true;error='';notice='';});
  try{
   await widget.api.adsPost('/api/ceo/ads/drafts',body);
   if(mounted){
    setState(()=>notice='Đã lưu bản nháp, chưa tạo hoặc phát quảng cáo.');
    final rows=await widget.api.adsDrafts();
    if(mounted)setState(()=>draftRows=objects(rows));
   }
  }catch(e){if(mounted)setState(()=>error=humanError(e));}
  finally{if(mounted)setState(()=>saving=false);}
 }
 Future<void> deleteDraft(String id)async{
  if(!widget.api.grantedScopes.contains('ceo.ads.draft'))return;
  final confirmed=await showDialog<bool>(context:context,builder:(context)=>
   AlertDialog(title:const Text('Xóa bản nháp?'),
    content:const Text('Chỉ xóa dữ liệu nháp Futurebook, không thay đổi chiến dịch trên Google Ads.'),
    actions:[
     TextButton(onPressed:()=>Navigator.pop(context,false),child:const Text('Hủy')),
     FilledButton(onPressed:()=>Navigator.pop(context,true),child:const Text('Xóa nháp'))]));
  if(confirmed!=true||!mounted)return;
  try{
   await widget.api.adsDeleteDraft(id);
   final rows=await widget.api.adsDrafts();
   if(mounted)setState((){draftRows=objects(rows);notice='Đã xóa bản nháp.';});
  }catch(e){if(mounted)setState(()=>error=humanError(e));}
 }
 Future<void> connect()async{
  setState((){saving=true;error='';});
  try{
   final url=await widget.api.adsStartOAuth();
   if(mounted)oauth_nav.navigateGoogleConsent(url);
  }catch(e){if(mounted)setState(()=>error=humanError(e));}
  finally{if(mounted)setState(()=>saving=false);}
 }
 Future<void> chooseCustomer()async{
  setState((){saving=true;error='';});
  try{
   final response=await widget.api.adsPost('/api/ceo/ads/oauth/status',{});
   final ids=(response['customers'] as List? ?? const [])
    .whereType<String>().toList();
   if(!mounted)return;
   if(ids.isEmpty){setState(()=>error='Google Ads không trả tài khoản được cấp quyền.');return;}
   final selected=await showDialog<String>(context:context,
    builder:(dialog)=>SimpleDialog(title:const Text('Chọn tài khoản quảng cáo'),
     children:[for(final id in ids)SimpleDialogOption(
      onPressed:()=>Navigator.pop(dialog,id),child:Text('Google Ads ID: '+id))]));
   if(selected==null)return;
   await widget.api.adsPost('/api/ceo/ads/oauth/status',{'customerId':selected});
   await reload();
  }catch(e){if(mounted)setState(()=>error=humanError(e));}
  finally{if(mounted)setState(()=>saving=false);}
 }
 Widget input(TextEditingController c,String label,{int maxLines=1,String? hint}){
  return TextField(controller:c,maxLines:maxLines,minLines:1,
   style:const TextStyle(fontSize:13,color:ceoInk),
   decoration:InputDecoration(labelText:label,hintText:hint,
    labelStyle:const TextStyle(fontSize:13),isDense:true));
 }
 Widget actions(List<Widget> children)=>Padding(
  padding:const EdgeInsets.only(top:12),
  child:Wrap(spacing:8,runSpacing:8,children:children));
 Widget groupLabel(String text)=>Padding(padding:const EdgeInsets.only(top:14,bottom:7),
  child:Text(text,style:const TextStyle(fontSize:13,fontWeight:FontWeight.w700,
   color:ceoInk)));
 Widget showStatus(){
  final text=switch(status){
   'unconfigured'=>'Chưa cấu hình Google Ads API/OAuth trên CEO Gateway.',
   'disconnected'=>'Chưa kết nối tài khoản Google Ads. Kết nối Google Search Console không thay thế Google Ads.',
   'migration_required'=>'Chưa áp dụng migration ADS131 trên Neon production. Không có số liệu mẫu.',
   'select_customer'=>'Đã kết nối OAuth. Owner cần chọn đúng Customer ID để đọc dữ liệu.',
   _=>'Google Ads chưa sẵn sàng. Kiểm tra quyền và cấu hình.'};
  return Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
   Text(text,style:const TextStyle(fontSize:13,color:ceoMuted)),
   if(status=='unconfigured')const Padding(
    padding:EdgeInsets.only(top:7),child:Text(
     'Cần OAuth Client ID/Secret, khóa mã hóa và Google Ads API được cấp quyền. Token chỉ lưu phía server.',
     style:TextStyle(fontSize:12,color:ceoMuted))),
   if(status=='disconnected')actions([
    FilledButton.icon(onPressed:saving?null:()=>unawaited(connect()),
     icon:const Icon(Icons.link,size:17),label:const Text('Owner kết nối Google Ads'))]),
   if(status=='select_customer')actions([
    FilledButton(onPressed:saving?null:()=>unawaited(chooseCustomer()),
     child:const Text('Chọn Customer ID'))]),
  ]);
 }
 Widget geoPicker()=>Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  groupLabel('Khu vực · tra cứu geo target Google Ads hiện hành'),
  input(geoNames,'Địa danh (ví dụ: Ho Chi Minh City; Can Tho)',maxLines:2),
  actions([OutlinedButton.icon(
   onPressed:searching?null:()=>unawaited(lookupGeos()),
   icon:const Icon(Icons.place_outlined,size:17),label:const Text('Tra cứu khu vực'))]),
  if(suggestions.isNotEmpty)Padding(padding:const EdgeInsets.only(top:8),
   child:Wrap(spacing:6,runSpacing:5,
    children:[for(final g in suggestions)
     FilterChip(label:Text((g['name']??'').toString()+' · '+(g['type']??'').toString(),
      style:const TextStyle(fontSize:12)),
      selected:chosenGeos.contains(g['resourceName']),
      onSelected:(selected){setState((){
       final code=(g['resourceName']??'').toString();
       if(selected&&chosenGeos.length<10){chosenGeos.add(code);}
       else{chosenGeos.remove(code);}
      });})])),
  if(chosenGeos.isNotEmpty)Padding(padding:const EdgeInsets.only(top:8),
   child:Text('Đã chọn '+chosenGeos.length.toString()+' geo target · Tiếng Việt · Google Search',
    style:const TextStyle(fontSize:12,color:ceoPurple))),
 ]);
 Widget keywordPanel()=>Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  input(seed,'Từ khóa hạt giống (mỗi dòng một từ)',maxLines:3),
  geoPicker(),
  actions([
   FilledButton.icon(onPressed:searching||chosenGeos.isEmpty?null:
    ()=>unawaited(lookupKeywords('ideas')),
    icon:const Icon(Icons.auto_awesome_outlined,size:17),label:const Text('Gợi ý từ khóa')),
   OutlinedButton(onPressed:searching||chosenGeos.isEmpty?null:
    ()=>unawaited(lookupKeywords('historical')),
    child:const Text('Số liệu lịch sử')),
   OutlinedButton(onPressed:saving||lines(seed.text).isEmpty?null:()async{
    final name=await askName('Đặt tên bộ từ khóa');
    if(name==null||!mounted)return;
    await createDraft({'kind':'keyword_set','name':name,'keywords':lines(seed.text),
     'geos':chosenGeos.isEmpty?[]:chosenGeos});
   },child:const Text('Lưu bộ từ khóa nháp')),
  ]),
  if(searching)const Padding(padding:EdgeInsets.only(top:10),
   child:LinearProgressIndicator(minHeight:2)),
  if(keywordRows.isNotEmpty)...[
   groupLabel('Google Ads · lượt tìm kiếm lịch sử và giá thầu đầu trang'),
   for(final row in keywordRows)Container(
    margin:const EdgeInsets.only(bottom:7),padding:const EdgeInsets.all(11),
    decoration:BoxDecoration(border:Border.all(color:ceoBorder),
     borderRadius:BorderRadius.circular(ceoRadius)),child:Column(
      crossAxisAlignment:CrossAxisAlignment.start,children:[
       Text((row['keyword']??'').toString(),
        style:const TextStyle(fontWeight:FontWeight.w700,fontSize:13,color:ceoInk)),
       const SizedBox(height:5),
       Text('Tìm kiếm TB/tháng: '+value(row['averageMonthlySearches'])+
        ' · Cạnh tranh: '+(row['competition']??'—').toString()+
        ' · Chỉ số: '+value(row['competitionIndex']),
        style:const TextStyle(fontSize:12,color:ceoMuted)),
       Text('Giá thầu đầu trang (thấp–cao): '+money(row['lowTopOfPageBid'])+
        ' – '+money(row['highTopOfPageBid'])+
        ' · CPC ước tính (nếu có): '+money(row['estimatedAverageCpc']),
        style:const TextStyle(fontSize:12,color:ceoMuted)),
      ])),
  ],
  draftList('Bộ từ khóa đã lưu','keyword_set'),
  const Padding(padding:EdgeInsets.only(top:10),child:Text(
   'Lượt tìm kiếm, cạnh tranh và giá thầu là dữ liệu Google Ads dự báo/lịch sử; không phải CPC thực chi.',
   style:TextStyle(fontSize:12,color:ceoMuted)))
 ]);
 Future<String?> askName(String title)async{
  draftName.clear();
  return showDialog<String>(context:context,builder:(dialog)=>AlertDialog(
   title:Text(title),
   content:TextField(controller:draftName,maxLength:100,
    decoration:const InputDecoration(labelText:'Tên bản nháp')),
   actions:[
    TextButton(onPressed:()=>Navigator.pop(dialog),child:const Text('Hủy')),
    FilledButton(onPressed:()=>Navigator.pop(dialog,draftName.text.trim()),
     child:const Text('Tiếp tục'))]));
 }
 Future<void> createCampaignDraft()async{
  final name=await askName('Tạo chiến dịch Search B2B nháp');
  if(name==null||name.length<3||!mounted)return;
  final keywords=TextEditingController(text:seed.text);
  final result=await showDialog<Map<String,dynamic>>(context:context,builder:(dialog)=>
   AlertDialog(title:const Text('Soạn chiến dịch · chưa phát hành'),
    content:SizedBox(width:460,child:SingleChildScrollView(
     child:Column(mainAxisSize:MainAxisSize.min,children:[
      TextField(controller:keywords,maxLines:3,
       decoration:const InputDecoration(labelText:'Từ khóa (mỗi dòng một từ)')),
      TextField(controller:negatives,maxLines:2,
       decoration:const InputDecoration(labelText:'Từ khóa phủ định')),
      DropdownButtonFormField<String>(initialValue:matchType,
       items:const [
        DropdownMenuItem(value:'EXACT',child:Text('Chính xác')),
        DropdownMenuItem(value:'PHRASE',child:Text('Cụm từ')),
        DropdownMenuItem(value:'BROAD',child:Text('Rộng'))],
       onChanged:(v){if(v!=null)matchType=v;},
       decoration:const InputDecoration(labelText:'Đối sánh')),
      TextField(controller:budget,keyboardType:TextInputType.number,
       decoration:InputDecoration(labelText:'Ngân sách/ngày · '+currency)),
      TextField(controller:landing,
       decoration:const InputDecoration(labelText:'Trang đích https://www.fbmn.vn/...')),
      const SizedBox(height:12),
      const Text('Mặc định DRAFT_PAUSED. Chưa gửi chiến dịch sang Google Ads.',
       style:TextStyle(fontSize:12,color:ceoMuted))
     ]))),
    actions:[
     TextButton(onPressed:()=>Navigator.pop(dialog),child:const Text('Hủy')),
     FilledButton(onPressed:()=>Navigator.pop(dialog,{
      'kind':'campaign','name':name,'keywords':lines(keywords.text),
      'negativeKeywords':lines(negatives.text),'matchType':matchType,
      'budgetDaily':double.tryParse(budget.text.trim())??-1,
      'geos':chosenGeos,'landingUrl':landing.text.trim()}),
      child:const Text('Lưu bản nháp'))
    ]));
  keywords.dispose();
  if(result!=null&&mounted)await createDraft(result);
 }
 Widget draftList(String title,String kind){
  final records=draftRows.where((d)=>d['kind']==kind).toList();
  return Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   groupLabel(title+' ('+records.length.toString()+')'),
   if(records.isEmpty)const Text('Chưa lưu bản nháp nào.',
    style:TextStyle(fontSize:12,color:ceoMuted)),
   for(final d in records)Padding(padding:const EdgeInsets.only(bottom:7),
    child:Row(children:[
     Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
      Text((d['name']??'').toString(),style:const TextStyle(fontSize:13,color:ceoInk)),
      Text('Nháp · chưa phát hành',style:const TextStyle(fontSize:12,color:ceoMuted)),
     ])),
     if(widget.api.grantedScopes.contains('ceo.ads.draft'))
      IconButton(tooltip:'Xóa bản nháp',onPressed:()=>unawaited(
       deleteDraft((d['id']??'').toString())),
       icon:const Icon(Icons.delete_outline,size:20,color:ceoMuted)),
    ]))
  ]);
 }
 Widget campaignsPanel()=>Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  const Text('Danh sách đọc trực tiếp từ Google Ads. Không thay chiến dịch đang chạy.',
   style:TextStyle(fontSize:12,color:ceoMuted)),
  groupLabel('Chiến dịch trên Customer '+customer),
  if(campaignRows.isEmpty)const CeoEmptyResult(
   title:'Chưa có chiến dịch',detail:'Không có chiến dịch Google Ads trong tài khoản này.',
   icon:Icons.campaign_outlined),
  for(final c in campaignRows)Container(
   margin:const EdgeInsets.only(bottom:7),padding:const EdgeInsets.all(12),
   decoration:BoxDecoration(border:Border.all(color:ceoBorder),
    borderRadius:BorderRadius.circular(ceoRadius)),child:Column(
     crossAxisAlignment:CrossAxisAlignment.start,children:[
      Text((c['name']??'').toString(),style:const TextStyle(
       fontSize:13,fontWeight:FontWeight.w700,color:ceoInk)),
      const SizedBox(height:5),
      Text('ID '+(c['id']??'').toString()+' · '+(c['status']??'').toString()+
       ' · '+(c['type']??'').toString(),
       style:const TextStyle(fontSize:12,color:ceoMuted)),
      Text('Ngân sách/ngày: '+money(c['dailyBudget']),
       style:const TextStyle(fontSize:12,color:ceoMuted))
     ])),
  if(widget.api.grantedScopes.contains('ceo.ads.draft'))...[
   geoPicker(),
   actions([FilledButton.icon(
    onPressed:saving||chosenGeos.isEmpty?null:()=>unawaited(createCampaignDraft()),
    icon:const Icon(Icons.edit_note,size:18),
    label:const Text('Tạo chiến dịch nháp'))])
  ],
  draftList('Chiến dịch Futurebook đã lưu nháp','campaign'),
  const Padding(padding:EdgeInsets.only(top:10),
   child:Text('Chưa có thao tác phát hành/bật/tắt/đổi ngân sách lên Google Ads. '
    'Mọi thay đổi phát sinh chi phí phải được Owner duyệt đúng payload trong CEO.',
    style:TextStyle(fontSize:12,color:ceoMuted))),
 ]);
 Widget statText(String label,Object? raw,{int decimals=0})=>Padding(
  padding:const EdgeInsets.only(bottom:7),
  child:Row(children:[
   Expanded(child:Text(label,style:const TextStyle(fontSize:13,color:ceoMuted))),
   Text(value(raw,decimals),style:const TextStyle(fontSize:13,
    fontWeight:FontWeight.w700,color:ceoPurple))
  ]));
 Widget performancePanel(){
  final report=performance;
  if(report==null)return const CeoEmptyResult(
   title:'Chưa có báo cáo Google Ads',detail:'Không thay số liệu thiếu bằng 0.');
  final metrics=obj(report['metrics']),previous=obj(report['previous']);
  final adsChannels=widget.marketing?.channels.where((v)=>
   v.channel=='google_ads'||v.channel=='google_paid').toList();
  final sessions=adsChannels==null?null:adsChannels.fold<int>(0,(a,b)=>a+b.sessions);
  final leads=adsChannels==null?null:adsChannels.fold<int>(0,(a,b)=>a+b.leadSessions);
  return Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   groupLabel('Google Ads · kỳ '+widget.period+' · '+zone),
   statText('Lượt hiển thị',metrics['impressions']),
   statText('Lượt nhấp',metrics['clicks']),
   statText('CTR (%)',metrics['ctr'] is num?(metrics['ctr'] as num)*100:null,decimals:2),
   statText('Chi phí thực ('+currency+')',metrics['cost'],decimals:2),
   statText('CPC thực ('+currency+')',metrics['cpc'],decimals:2),
   const Divider(),
   groupLabel('Google Ads · kỳ trước cùng số ngày'),
   statText('Lượt nhấp kỳ trước',previous['clicks']),
   statText('Chi phí kỳ trước ('+currency+')',previous['cost'],decimals:2),
   const Divider(),
   groupLabel('PostHog · nguồn Google Ads (không cộng vào Google Ads API)'),
   statText('Phiên theo first-touch PostHog',sessions),
   statText('Phiên có lead B2B PostHog',leads),
   const Text('CPL: — · Chưa có khóa đối sánh đáng tin cậy giữa campaign Google Ads, '
    'UTM và phiên PostHog. Một phiên không đồng nghĩa một khách hàng/hợp đồng.',
    style:TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:6),
   const Text('Không suy chi phí từ PostHog/GSC; không tự tính ROAS, doanh thu hay lợi nhuận.',
    style:TextStyle(fontSize:12,color:ceoMuted)),
   groupLabel('Google Ads · chi phí từng ngày'),
   for(final d in objects(report['daily']))Padding(
    padding:const EdgeInsets.symmetric(vertical:5),
    child:Row(children:[
     Expanded(child:Text((d['date']??'').toString(),
      style:const TextStyle(fontSize:12,color:ceoMuted))),
     Text(money(d['cost'])+' · '+value(d['clicks'])+' click',
      style:const TextStyle(fontSize:12,color:ceoInk))
    ]))
  ]);
 }
 @override Widget build(BuildContext context)=>CeoPanel(
  title:title,subtitle:subtitle,
  icon:widget.kind==0?Icons.key_outlined:
   widget.kind==1?Icons.campaign_outlined:Icons.query_stats_outlined,
  child:Column(key:ValueKey('ceo-ads-panel-'+widget.kind.toString()),
   crossAxisAlignment:CrossAxisAlignment.stretch,children:[
    if(status=='ready')Text('Customer '+customer+' · '+currency+' · '+zone,
     style:const TextStyle(fontSize:12,color:ceoPurple,fontWeight:FontWeight.w700)),
    if(loading)const LinearProgressIndicator(minHeight:2),
    if(error.isNotEmpty)Padding(padding:const EdgeInsets.symmetric(vertical:8),
     child:Text(error,style:const TextStyle(fontSize:12,color:Color(0xFFB45309)))),
    if(notice.isNotEmpty)Padding(padding:const EdgeInsets.symmetric(vertical:7),
     child:Text(notice,style:const TextStyle(fontSize:12,color:ceoMuted))),
    if(!loading&&status!='ready')showStatus(),
    if(!loading&&status=='ready')switch(widget.kind){
     0=>keywordPanel(),1=>campaignsPanel(),_=>performancePanel()},
    if(!loading&&error.isNotEmpty)actions([
     OutlinedButton.icon(onPressed:()=>unawaited(reload()),
      icon:const Icon(Icons.refresh,size:17),label:const Text('Thử lại'))])
  ])
 );
}
