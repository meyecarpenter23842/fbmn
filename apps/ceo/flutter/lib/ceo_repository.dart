import 'dart:convert';
import 'package:http/http.dart' as http;
import 'ceo_models.dart';
import 'ceo_mail_models.dart';
import 'ceo_stats_models.dart';
import 'http_client_stub.dart' if (dart.library.js_interop) 'http_client_web.dart' as platform;

/// Same-origin only. No token storage, credential logging or direct private Worker requests.
abstract class CeoRepository{
 Future<void> signIn(String email,String password);
 Future<void> signOut();
 Future<bool> ownerSession();
 Future<CeoPage<CeoConversation>> conversations([int page=1]);
 Future<List<CeoTurn>> turns(String session);
 Future<CeoPage<CeoRequest>> contactRequests([int page=1]);
 Future<CeoPage<CeoRequest>> outsourcingRequests([int page=1]);
 Future<String> markViewed(String kind,String id);
 Future<CeoAlerts> loadAlerts();
 Future<void> markAlertRead(String kind,String id,{String? turnId});
 Future<CeoWebStatistics> websiteStatistics(String period);
 Future<CeoMailPage> mailList(String box,{String? after});
 Future<CeoMailItem> mailDetail(String box,String id);
 Future<String> mailSend({required String to,required String subject,required String text,String? replyId,String? requestId,List<CeoMailAttachment> attachments=const []});
 void dispose();
}
class CeoApiException implements Exception{
 final int status;
 const CeoApiException(this.status);
 @override String toString()=>switch(status){
  401=>"Phiên đăng nhập chưa được xác nhận. Vui lòng đăng nhập lại.",
  403=>"Tài khoản không có quyền Owner.",
  400=>"Thông tin email chưa hợp lệ.",
  413=>"Email hoặc tệp đính kèm vượt dung lượng cho phép.",
  429=>"Dịch vụ email đang giới hạn lượt gửi; vui lòng thử lại.",
  503=>"Dịch vụ tạm thời không kết nối.",
  _=>"Chưa tải được dữ liệu. Vui lòng thử lại."};
}
class CeoApi implements CeoRepository {
 final http.Client _client;
 CeoApi({http.Client? client}):_client=client??platform.createClient();
 Uri _url(String path)=>Uri.base.resolve(path);
 Future<Map<String,dynamic>> _request(String method,String path,{Map<String,dynamic>? json,String? bearer,Duration timeout=const Duration(seconds:15)}) async{
  final headers=<String,String>{"Accept":"application/json"};
  if(json!=null)headers["Content-Type"]="application/json";
  if(bearer!=null)headers["Authorization"]="Bearer $bearer";
  http.Response response;
  try{
   final request=http.Request(method,_url(path))..headers.addAll(headers);
   if(json!=null)request.body=jsonEncode(json);
   response=await _client.send(request).then(http.Response.fromStream)
     .timeout(timeout);
  }catch(_){throw const CeoApiException(503);}
  if(response.statusCode<200||response.statusCode>=300)throw CeoApiException(response.statusCode);
  try{
   final decoded=jsonDecode(response.body);
   // Better Auth returns the literal JSON null when no session cookie exists.
   // Treat only this exact same-origin session response as unauthenticated,
   // never silently reinterpret malformed data from other Owner endpoints.
   if(method=='GET'&&path=='/api/auth/get-session'&&decoded==null){
    return <String,dynamic>{'session':null};
   }
   if(decoded is Map<String,dynamic>)return decoded;
  }catch(_){/* fail-closed on wrong response */}
  throw const CeoApiException(503);
 }
 static final _jwtPattern=RegExp(r'^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$');
 /// Fetch a fresh managed Neon JWT from the same origin used by Futurebook Admin.
 /// The JWT is ephemeral: do not persist it or send it to analytics.
 String? _validJwt(Object? value)=>
  value is String&&value.length<=12000&&_jwtPattern.hasMatch(value)?value:null;
 String? _authTokenFrom(Map<String,dynamic> json){
  final data=json['data'];
  final t=json['token']??(data is Map<String,dynamic>?data['token']:null);
  return _validJwt(t);
 }
 String? _sessionTokenFrom(Map<String,dynamic> json){
  // Same-origin Better Auth session refresh. Never store this JWT locally.
  final data=json['data'];
  final wrapped=data is Map<String,dynamic>?data:json;
  final session=wrapped['session'];
  return session is Map<String,dynamic>?
   _validJwt(session['access_token']??session['accessToken']):null;
 }
 Future<String> _ownerJwt() async{
  // A signed proxy session-data cookie can expire before the underlying
  // persistent Neon Auth session. Recover through the cookie-backed session
  // endpoint before deciding that the Owner needs to sign in again.
  try{
   final token=_authTokenFrom(await _request('GET','/api/auth/token'));
   if(token!=null){return token;}
  }on CeoApiException catch(e){
   if(e.status!=401){rethrow;}
  }
  // get-session causes the managed auth layer to refresh its session cache and
  // cookie when the underlying server session still exists.
  try{
   final token=_sessionTokenFrom(await _request('GET','/api/auth/get-session'));
   if(token!=null){return token;}
  }on CeoApiException catch(e){
   if(e.status!=401){rethrow;}
  }
  // Some Neon versions omit access_token from get-session; retry the token API
  // once after the session refresh rather than treating the first 401 as logout.
  try{
   final token=_authTokenFrom(await _request('GET','/api/auth/token'));
   if(token!=null){return token;}
  }on CeoApiException catch(e){
   if(e.status!=401){rethrow;}
  }
  throw const CeoApiException(401);
 }
 @override Future<void> signIn(String email,String password) async{
  await _request("POST","/api/auth/sign-in/email",json:{
   "email":email.trim().toLowerCase(),"password":password,"rememberMe":true});
  if(!await ownerSession())throw const CeoApiException(401);
 }
 @override Future<void> signOut() async{
  await _request("POST","/api/auth/sign-out",json:{});
 }
 @override Future<bool> ownerSession() async{
  String jwt;
  try{jwt=await _ownerJwt();}
  on CeoApiException catch(e){
   if(e.status==401){return false;}
   rethrow;
  }
  Future<bool> checkRole(String token)async{
   final response=await _request('GET','/api/ceo/session',bearer:token);
   return (response['data'] as Map<String,dynamic>?)?['role']=='owner';
  }
  try{return await checkRole(jwt);}
  on CeoApiException catch(e){
   if(e.status!=401){rethrow;}
   // Token can expire while the secure Better Auth cookie still holds a
   // valid Owner session. Revalidate the cookie, not the stale bearer.
   try{
    final fromSession=_sessionTokenFrom(
     await _request('GET','/api/auth/get-session'));
    final token=fromSession??_authTokenFrom(
     await _request('GET','/api/auth/token'));
    if(token==null){return false;}
    return await checkRole(token);
   }on CeoApiException catch(error){
    if(error.status==401){return false;}
    rethrow;
   }
  }
 }
 Future<Map<String,dynamic>> _data(String route) async{
  final jwt=await _ownerJwt();
  final response=await _request("GET",route,bearer:jwt);
  final data=response["data"];
  if(data is Map<String,dynamic>)return data;
  throw const CeoApiException(503);
 }
 @override Future<CeoPage<CeoConversation>> conversations([int page=1]) async{
  final j=await _data("/api/ceo/chat-history?page=$page");
  return CeoPage((j["conversations"] as List? ?? const [])
    .map(CeoConversation.fromJson).toList(growable:false),j["page"] as int? ?? page,j["hasMore"]==true);
 }
 @override Future<List<CeoTurn>> turns(String session) async{
  if(!RegExp(r'^[a-f0-9]{36}$').hasMatch(session))throw const CeoApiException(400);
  // The existing Worker uses oldest-first pages. Read every available page and
  // display only the latest 25; never acknowledge a turn the Owner did not see.
  var latest=<CeoTurn>[];
  for(var page=1;page<=100;page++){
   final j=await _data('/api/ceo/chat-history?session=$session&page=$page');
   final batch=(j['turns'] as List? ?? const [])
    .map(CeoTurn.fromJson).toList(growable:false);
   latest=[...latest,...batch];
   if(latest.length>25)latest=latest.sublist(latest.length-25);
   if(j['hasMore']!=true)return latest;
  }
  // Overlong history is not silently marked read, until pagination is supported.
  throw const CeoApiException(503);
 }
 @override Future<CeoPage<CeoRequest>> contactRequests([int page=1]) async{
  final j=await _data("/api/ceo/contact-requests?page=$page");
  return CeoPage((j["requests"] as List? ?? const [])
    .map(CeoRequest.fromJson).toList(growable:false),j["page"] as int? ?? page,j["hasMore"]==true);
 }
 @override Future<CeoPage<CeoRequest>> outsourcingRequests([int page=1]) async{
  final j=await _data("/api/ceo/outsourcing-requests?page=$page");
  return CeoPage((j["requests"] as List? ?? const [])
    .map(CeoRequest.fromJson).toList(growable:false),j["page"] as int? ?? page,j["hasMore"]==true);
 }
 @override Future<CeoAlerts> loadAlerts()async=>
  CeoAlerts.fromJson(await _data('/api/ceo/alerts'));
 @override Future<void> markAlertRead(String kind,String id,{String? turnId})async{
  if(!['chat','mail'].contains(kind)||!RegExp(r'^[a-f0-9-]{36}$').hasMatch(id)||
    (kind=='chat'&&(turnId==null||!RegExp(r'^[1-9][0-9]{0,18}$').hasMatch(turnId)))){
   throw const CeoApiException(400);
  }
  final jwt=await _ownerJwt();
  final payload=<String,dynamic>{'kind':kind,'id':id,
   if(kind=='chat')'turnId':turnId};
  try{
   await _request('POST','/api/ceo/alerts',bearer:jwt,json:payload);
  }on CeoApiException catch(error){
   if(error.status!=401){rethrow;}
   // A cached JWT may be rejected while the secure Better Auth session cookie
   // is still valid. The read-through write is idempotent, so refresh the
   // cookie-backed JWT and retry exactly once, never bypassing Owner checks.
   final session=await _request('GET','/api/auth/get-session');
   final renewed=_sessionTokenFrom(session) ??
    _authTokenFrom(await _request('GET','/api/auth/token'));
   if(renewed==null){throw const CeoApiException(401);}
   await _request('POST','/api/ceo/alerts',bearer:renewed,json:payload);
  }
 }
 @override Future<String> markViewed(String kind,String id)async{
  if(!["contact","outsourcing"].contains(kind)||
     !RegExp(r'^[0-9a-fA-F-]{36}' r'$').hasMatch(id)){
   throw const CeoApiException(400);
  }
  final jwt=await _ownerJwt();
  final response=await _request("POST","/api/ceo/reads",
   json:{"kind":kind,"id":id},bearer:jwt);
  final data=response["data"];
  final stamp=data is Map<String,dynamic> ? data["viewedAt"] : null;
  if(stamp is! String||DateTime.tryParse(stamp)==null)throw const CeoApiException(503);
  return stamp;
 }

 @override Future<CeoWebStatistics> websiteStatistics(String period)async{
  if(!['7d','30d','90d'].contains(period))throw const CeoApiException(400);
  return CeoWebStatistics.fromJson(await _data('/api/ceo/statistics?period=$period'));
 }
 @override Future<CeoMailPage> mailList(String box,{String? after})async{
  if(box!='inbox'&&box!='sent'){throw const CeoApiException(400);}
  final afterParam=after==null?'':'&after=$after';
  final j=await _data('/api/ceo/mail?box=$box&limit=20$afterParam');
  return CeoMailPage.fromJson(j);
 }
 @override Future<CeoMailItem> mailDetail(String box,String id)async{
  if(!['inbox','sent'].contains(box)||id.length!=36){
   throw const CeoApiException(400);
  }
  return CeoMailItem.fromJson(await _data('/api/ceo/mail/$id?box=$box'));
 }
 @override Future<String> mailSend({required String to,required String subject,
  required String text,String? replyId,String? requestId,List<CeoMailAttachment> attachments=const []})async{
  final jwt=await _ownerJwt();
  final result=await _request('POST','/api/ceo/mail',bearer:jwt,timeout:const Duration(seconds:40),json:{
   'to':to,'subject':subject,'text':text,
   if(replyId!=null)'replyId':replyId,
   if(requestId!=null)'requestId':requestId,
   if(attachments.isNotEmpty)'attachments':attachments.map((a)=>a.toJson()).toList(),
  });
  final data=result['data'];
  if(data is! Map<String,dynamic>||data['id'] is! String){
   throw const CeoApiException(503);
  }
  return data['id'] as String;
 }
 @override void dispose()=>_client.close();
}
