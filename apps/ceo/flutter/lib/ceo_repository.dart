import 'dart:convert';
import 'package:http/http.dart' as http;
import 'ceo_models.dart';
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
 void dispose();
}
class CeoApiException implements Exception{
 final int status;
 const CeoApiException(this.status);
 @override String toString()=>switch(status){
  401=>"Phiên đăng nhập đã hết hạn.",
  403=>"Tài khoản không có quyền Owner.",
  503=>"Dịch vụ tạm thời không kết nối.",
  _=>"Chưa tải được dữ liệu. Vui lòng thử lại."};
}
class CeoApi implements CeoRepository {
 final http.Client _client;
 CeoApi({http.Client? client}):_client=client??platform.createClient();
 Uri _url(String path)=>Uri.base.resolve(path);
 Future<Map<String,dynamic>> _request(String method,String path,{Map<String,dynamic>? json}) async{
  final headers=<String,String>{"Accept":"application/json"};
  if(json!=null)headers["Content-Type"]="application/json";
  http.Response response;
  try{
   final request=http.Request(method,_url(path))..headers.addAll(headers);
   if(json!=null)request.body=jsonEncode(json);
   response=await _client.send(request).then(http.Response.fromStream)
     .timeout(const Duration(seconds:15));
  }catch(_){throw const CeoApiException(503);}
  if(response.statusCode<200||response.statusCode>=300)throw CeoApiException(response.statusCode);
  try{
   final decoded=jsonDecode(response.body);
   if(decoded is Map<String,dynamic>)return decoded;
  }catch(_){/* fail-closed on wrong response */}
  throw const CeoApiException(503);
 }
 @override Future<void> signIn(String email,String password) async{
  await _request("POST","/api/auth/sign-in/email",json:{
   "email":email.trim().toLowerCase(),"password":password,"rememberMe":false});
  if(!await ownerSession())throw const CeoApiException(403);
 }
 @override Future<void> signOut() async{
  await _request("POST","/api/auth/sign-out",json:{});
 }
 @override Future<bool> ownerSession() async{
  try{
   final response=await _request("GET","/api/ceo/session");
   return (response["data"] as Map<String,dynamic>?)?["role"]=="owner";
  }on CeoApiException catch(e){
   if(e.status==401||e.status==403)return false;
   rethrow;
  }
 }
 Future<Map<String,dynamic>> _data(String route) async{
  final j=await _request("GET",route);
  final data=j["data"];
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
  final j=await _data("/api/ceo/chat-history?session=$session&page=1");
  return (j["turns"] as List? ?? const []).map(CeoTurn.fromJson).toList(growable:false);
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
 @override void dispose()=>_client.close();
}
