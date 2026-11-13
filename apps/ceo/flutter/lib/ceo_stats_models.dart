// DL12B aggregate statistics; no personal data.
class CeoStatRank{
 final String label;
 final int count;
 const CeoStatRank(this.label,this.count);
 factory CeoStatRank.fromJson(Object? v){
  final m=v is Map<String,dynamic>?v:<String,dynamic>{};
  return CeoStatRank(m['label'] is String?m['label'] as String:'',_n(m['count']));
 }
}
class CeoStatDay{
 final String day;
 final int visits,pageViews;
 const CeoStatDay(this.day,this.visits,this.pageViews);
 factory CeoStatDay.fromJson(Object? v){
  final m=v is Map<String,dynamic>?v:<String,dynamic>{};
  return CeoStatDay(m['day'] is String?m['day'] as String:'',_n(m['visits']),_n(m['pageViews']));
 }
}
int _n(Object? value)=>value is num&&value>=0?value.toInt():0;
class CeoWebStatistics{
 final String period,timezone,generatedAt;
 final bool cached;
 final Map<String,int> metrics;
 final List<CeoStatDay> daily;
 final List<CeoStatRank> sources,products,categories;
 const CeoWebStatistics({required this.period,required this.timezone,required this.generatedAt,
  required this.metrics,required this.daily,required this.sources,required this.products,required this.categories,
  this.cached=false});
 int metric(String key)=>metrics[key]??0;
 bool get hasEvents=>metrics.values.any((n)=>n>0);
 factory CeoWebStatistics.fromJson(Map<String,dynamic> json){
  final m=json['metrics'] is Map<String,dynamic>?json['metrics'] as Map<String,dynamic>:<String,dynamic>{};
  List<CeoStatRank> rank(String key)=>(json[key] as List? ?? const [])
   .map(CeoStatRank.fromJson).toList(growable:false);
  return CeoWebStatistics(period:json['period'] is String?json['period'] as String:'7d',
   timezone:json['timezone'] is String?json['timezone'] as String:'UTC',
   generatedAt:json['generatedAt'] is String?json['generatedAt'] as String:'',
   cached:json['cached']==true,
   metrics:m.map((k,v)=>MapEntry(k,_n(v))),
   daily:(json['daily'] as List? ?? const []).map(CeoStatDay.fromJson).toList(growable:false),
   sources:rank('sources'),products:rank('products'),categories:rank('categories'));
 }
}
