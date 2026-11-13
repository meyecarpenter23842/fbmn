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
 final int visits,pageViews,organicSessions,organicLeadSessions;
 const CeoStatDay(this.day,this.visits,this.pageViews,
  {this.organicSessions=0,this.organicLeadSessions=0});
 factory CeoStatDay.fromJson(Object? v){
  final m=v is Map<String,dynamic>?v:<String,dynamic>{};
  return CeoStatDay(m['day'] is String?m['day'] as String:'',_n(m['visits']),_n(m['pageViews']),
   organicSessions:_n(m['organicSessions']),organicLeadSessions:_n(m['organicLeadSessions']));
 }
}
int _n(Object? value)=>value is num&&value>=0?value.toInt():0;
// SEO05: intentionally counts *sessions*, never people or Google Search Console clicks.
class CeoSeoOverview{
 final int organicSessions,organicProductSessions,organicContactSessions,
  organicOutsourcingSessions,organicLeadSessions,googlePaidSessions,
  googleUnclassifiedSessions,organicCtaClicks;
 const CeoSeoOverview({this.organicSessions=0,this.organicProductSessions=0,
  this.organicContactSessions=0,this.organicOutsourcingSessions=0,
  this.organicLeadSessions=0,this.googlePaidSessions=0,
  this.googleUnclassifiedSessions=0,this.organicCtaClicks=0});
 double? get leadRatePercent=>organicSessions==0?null:
  (organicLeadSessions/organicSessions*100).clamp(0,100).toDouble();
 factory CeoSeoOverview.fromJson(Object? value){
  final m=value is Map<String,dynamic>?value:<String,dynamic>{};
  return CeoSeoOverview(
   organicSessions:_n(m['organicSessions']),organicProductSessions:_n(m['organicProductSessions']),
   organicContactSessions:_n(m['organicContactSessions']),
   organicOutsourcingSessions:_n(m['organicOutsourcingSessions']),
   organicLeadSessions:_n(m['organicLeadSessions']),
   googlePaidSessions:_n(m['googlePaidSessions']),
   googleUnclassifiedSessions:_n(m['googleUnclassifiedSessions']),
   organicCtaClicks:_n(m['organicCtaClicks']));
 }
}
// PH01: counted by anonymous Website session, not identifiable customers.
class CeoFunnelOverview{
 final int viewedSessions,ctaSessions,submittedSessions;
 const CeoFunnelOverview({this.viewedSessions=0,this.ctaSessions=0,this.submittedSessions=0});
 double? get viewToCtaPercent=>viewedSessions==0?null:
  (ctaSessions/viewedSessions*100).clamp(0,100).toDouble();
 double? get ctaToSubmitPercent=>ctaSessions==0?null:
  (submittedSessions/ctaSessions*100).clamp(0,100).toDouble();
 double? get overallPercent=>viewedSessions==0?null:
  (submittedSessions/viewedSessions*100).clamp(0,100).toDouble();
 int get notClicked=>viewedSessions-ctaSessions;
 int get notSubmitted=>ctaSessions-submittedSessions;
 factory CeoFunnelOverview.fromJson(Object? value){
  final m=value is Map<String,dynamic>?value:<String,dynamic>{};
  final views=_n(m['viewedSessions']), clicks=_n(m['ctaSessions']), leads=_n(m['submittedSessions']);
  if(clicks>views||leads>clicks)return const CeoFunnelOverview();
  return CeoFunnelOverview(viewedSessions:views,ctaSessions:clicks,submittedSessions:leads);
 }
}
class CeoWebStatistics{
 final String period,timezone,generatedAt;
 final bool cached,labelsUnavailable;
 final Map<String,int> metrics;
 final List<CeoStatDay> daily;
 final List<CeoStatRank> sources,products,categories,seoPages;
 final CeoSeoOverview seo;
 final CeoFunnelOverview funnel;
 const CeoWebStatistics({required this.period,required this.timezone,required this.generatedAt,
  required this.metrics,required this.daily,required this.sources,required this.products,required this.categories,
  this.seo=const CeoSeoOverview(),this.seoPages=const [],this.funnel=const CeoFunnelOverview(),
  this.cached=false,this.labelsUnavailable=false});
 int metric(String key)=>metrics[key]??0;
 bool get hasEvents=>metrics.values.any((n)=>n>0);
 factory CeoWebStatistics.fromJson(Map<String,dynamic> json){
  final m=json['metrics'] is Map<String,dynamic>?json['metrics'] as Map<String,dynamic>:<String,dynamic>{};
  List<CeoStatRank> rank(String key)=>(json[key] as List? ?? const [])
   .map(CeoStatRank.fromJson).toList(growable:false);
  return CeoWebStatistics(period:json['period'] is String?json['period'] as String:'7d',
   timezone:json['timezone'] is String?json['timezone'] as String:'UTC',
   generatedAt:json['generatedAt'] is String?json['generatedAt'] as String:'',
   cached:json['cached']==true,labelsUnavailable:json['labelsUnavailable']==true,
   metrics:m.map((k,v)=>MapEntry(k,_n(v))),
   daily:(json['daily'] as List? ?? const []).map(CeoStatDay.fromJson).toList(growable:false),
   sources:rank('sources'),products:rank('products'),categories:rank('categories'),
   seo:CeoSeoOverview.fromJson(json['seo']),seoPages:rank('seoPages'),
   funnel:CeoFunnelOverview.fromJson(json['funnel']));
 }
}
