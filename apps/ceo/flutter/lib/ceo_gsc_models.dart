// SEO06 — Google Search Console finalized organic-search performance, separate from PostHog sessions.
class CeoGscMetrics {
 final int clicks,impressions;
 final double ctr,position;
 const CeoGscMetrics({required this.clicks,required this.impressions,
  required this.ctr,required this.position});
 static CeoGscMetrics? parse(Object? value){
  if(value is! Map<String,dynamic>)return null;
  final c=value['clicks'],i=value['impressions'],r=value['ctr'],p=value['position'];
  if(c is! num||i is! num||r is! num||p is! num||
   !c.isFinite||!i.isFinite||!r.isFinite||!p.isFinite||
   c<0||i<0||r<0||r>1||p<0){return null;}
  return CeoGscMetrics(clicks:c.toInt(),impressions:i.toInt(),
   ctr:r.toDouble(),position:p.toDouble());
 }
 double get ctrPercent=>ctr*100;
}
class CeoGscRank {
 final String label;
 final CeoGscMetrics metrics;
 const CeoGscRank(this.label,this.metrics);
 static CeoGscRank? parse(Object? value){
  if(value is! Map<String,dynamic>)return null;
  final label=value['label'],m=CeoGscMetrics.parse(value);
  if(label is! String||label.trim().isEmpty||label.length>120||m==null)return null;
  return CeoGscRank(label,m);
 }
}
class CeoGscDay {
 final String date;
 final CeoGscMetrics metrics;
 const CeoGscDay(this.date,this.metrics);
 static CeoGscDay? parse(Object? value){
  if(value is! Map<String,dynamic>)return null;
  final day=value['date'],m=CeoGscMetrics.parse(value);
  if(day is! String||!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(day)||m==null){return null;}
  return CeoGscDay(day,m);
 }
}
class CeoGscReport {
 final String status,period,site,startDate,endDate,timezone,oauthStatus;
 final CeoGscMetrics? metrics;
 final List<CeoGscDay> daily;
 final List<CeoGscRank> queries,pages;
 const CeoGscReport({required this.status,required this.period,
  required this.site,required this.startDate,required this.endDate,
  required this.timezone,this.oauthStatus='unconfigured',this.metrics,this.daily=const [],
  this.queries=const [],this.pages=const []});
 bool get configured=>status=='ready';
 factory CeoGscReport.fromJson(Map<String,dynamic> json){
  final status=json['status'];
  if(status!='ready'&&status!='unconfigured')throw const FormatException('Invalid GSC status');
  List<T> parse<T>(String field,T? Function(Object?) mapper){
   final raw=json[field];
   if(raw is! List)return <T>[];
   return raw.map(mapper).whereType<T>().take(95).toList(growable:false);
  }
  return CeoGscReport(
   status:status as String,
   oauthStatus:json['oauthStatus'] is String?json['oauthStatus'] as String:'unconfigured',
   period:json['period'] is String?json['period'] as String:'7d',
   site:json['site'] is String?json['site'] as String:'www.fbmn.vn',
   startDate:json['startDate'] is String?json['startDate'] as String:'',
   endDate:json['endDate'] is String?json['endDate'] as String:'',
   timezone:json['timezone'] is String?json['timezone'] as String:'America/Los_Angeles',
   metrics:CeoGscMetrics.parse(json['metrics']),
   daily:parse('daily',CeoGscDay.parse),
   queries:parse('queries',CeoGscRank.parse).take(10).toList(growable:false),
   pages:parse('pages',CeoGscRank.parse).take(10).toList(growable:false),
  );
 }
}
