class CeoMailItem {
 final String id,from,subject,createdAt,status,messageId,text;
 final List<String> to,attachments;
 const CeoMailItem({required this.id,required this.from,required this.subject,
  required this.createdAt,required this.status,required this.messageId,
  required this.text,required this.to,required this.attachments});
 factory CeoMailItem.fromJson(Object? raw){
  final j=raw is Map<String,dynamic>?raw:<String,dynamic>{};
  String str(String key)=>j[key] is String?j[key] as String:'';
  List<String> values(String key)=>j[key] is List?
    (j[key] as List).whereType<String>().toList(growable:false):const [];
  final files=<String>[];
  if(j['attachments'] is List){
   for(final v in j['attachments'] as List){
    if(v is Map&&v['filename'] is String)files.add(v['filename'] as String);
   }
  }
  return CeoMailItem(id:str('id'),from:str('from'),to:values('to'),
   subject:str('subject'),createdAt:str('created_at'),status:str('status'),
   messageId:str('message_id'),text:str('text'),attachments:List.unmodifiable(files));
 }
}
class CeoMailPage {
 final List<CeoMailItem> items;
 final String? nextCursor;
 final bool hasMore;
 const CeoMailPage(this.items,this.nextCursor,this.hasMore);
 factory CeoMailPage.fromJson(Object? raw){
  final j=raw is Map<String,dynamic>?raw:<String,dynamic>{};
  final items=j['items'];
  final cursor=j['nextCursor'];
  return CeoMailPage(
   items is List?items.map(CeoMailItem.fromJson).toList(growable:false):const [],
   cursor is String&&cursor.isNotEmpty?cursor:null,
   j['hasMore']==true);
 }
}
