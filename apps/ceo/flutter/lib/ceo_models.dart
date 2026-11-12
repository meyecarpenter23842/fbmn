// Models reflect existing Owner-only Worker responses. No invented analytics or unread flags.
String _str(Object? value)=>value is String?value:"";
int _num(Object? value)=>value is int?value:0;
Map<String,dynamic> _object(Object? v)=>v is Map<String,dynamic>?v:<String,dynamic>{};
List<dynamic> _array(Object? v)=>v is List? v:<dynamic>[];

class CeoPage<T>{
 final List<T> items;
 final int page;
 final bool hasMore;
 const CeoPage(this.items,this.page,this.hasMore);
}

class CeoConversation {
 final String session,createdAt,updatedAt,latest;
 final int messageCount;
 const CeoConversation({required this.session,required this.createdAt,required this.updatedAt,
   required this.latest,required this.messageCount});
 factory CeoConversation.fromJson(Object? input) {
  final j=_object(input);
  return CeoConversation(session:_str(j["session"]),createdAt:_str(j["createdAt"]),
   updatedAt:_str(j["updatedAt"]),latest:_str(j["latest"]),messageCount:_num(j["messageCount"]));
 }
}
class CeoTurn{
 final String id,question,answer,createdAt;
 const CeoTurn({this.id='',required this.question,required this.answer,required this.createdAt});
 factory CeoTurn.fromJson(Object? input){
  final j=_object(input);
  return CeoTurn(id:_str(j['id']),question:_str(j["question"]),
   answer:_str(j["answer"]),createdAt:_str(j["createdAt"]));
 }
}
class CeoRequest{
 final String id,name,email,phone,company,province,customerGroup,
   productType,specifications,quantity,desiredDate,details,message,createdAt,status;
 final List<String> interests;
 final String? viewedAt;
 const CeoRequest({this.viewedAt,required this.id,required this.name,required this.email,required this.phone,
  required this.company,required this.province,required this.customerGroup,required this.productType,
  required this.specifications,required this.quantity,required this.desiredDate,required this.details,
  required this.message,required this.createdAt,required this.status,required this.interests});
 bool get pending=>status=="new";
 bool get unread=>pending&&viewedAt==null;
 CeoRequest markViewedAt(String timestamp)=>CeoRequest(
  id:id,name:name,email:email,phone:phone,company:company,province:province,
  customerGroup:customerGroup,productType:productType,specifications:specifications,
  quantity:quantity,desiredDate:desiredDate,details:details,message:message,
  createdAt:createdAt,status:status,interests:interests,viewedAt:timestamp);
 factory CeoRequest.fromJson(Object? input) {
  final j=_object(input);
  return CeoRequest(
   id:_str(j["id"]),name:_str(j["name"]),email:_str(j["email"]),phone:_str(j["phone"]),
   company:_str(j["company"]),province:_str(j["province"]),customerGroup:_str(j["customerGroup"]),
   productType:_str(j["productType"]),specifications:_str(j["specifications"]),
   quantity:_str(j["quantity"]),desiredDate:_str(j["desiredDate"]),details:_str(j["details"]),
   message:_str(j["message"]),createdAt:_str(j["createdAt"]),status:_str(j["status"]),
   viewedAt:j["viewedAt"] is String ? j["viewedAt"] as String : null,
   interests:_array(j["interests"]).whereType<String>().toList(growable:false));
 }
}

class CeoAlerts{
 final int chatCount,mailCount,contactCount,outsourcingCount,total;
 final List<String> chatIds,mailIds;
 const CeoAlerts({required this.chatCount,required this.mailCount,
  required this.contactCount,required this.outsourcingCount,
  required this.total,required this.chatIds,required this.mailIds});
 factory CeoAlerts.fromJson(Object? input){
  final j=_object(input),chat=_object(j['chat']),mail=_object(j['mail']);
  return CeoAlerts(chatCount:_num(chat['count']),mailCount:_num(mail['count']),
   contactCount:_num(j['contact']),outsourcingCount:_num(j['outsourcing']),
   total:_num(j['total']),
   chatIds:_array(chat['ids']).whereType<String>().toList(growable:false),
   mailIds:_array(mail['ids']).whereType<String>().toList(growable:false));
 }
}
