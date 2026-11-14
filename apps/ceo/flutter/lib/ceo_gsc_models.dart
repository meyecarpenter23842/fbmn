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

class CeoGscMovement {
 final String label,status;
 final CeoGscRank? current,previous;
 final int? clickDelta,impressionsDelta;
 final double? positionImprovement;
 const CeoGscMovement({required this.label,required this.status,
  this.current,this.previous,this.clickDelta,this.impressionsDelta,this.positionImprovement});
 static CeoGscMovement? parse(Object? value){
  if(value is! Map<String,dynamic>)return null;
  final label=value['label'],status=value['status'];
  if(label is! String||label.isEmpty||label.length>120||
    !const ['up','down','flat','new','left'].contains(status))return null;
  final current=CeoGscRank.parse(value['current']);
  final previous=CeoGscRank.parse(value['previous']);
  if(status=='new'&&(current==null||previous!=null))return null;
  if(status=='left'&&(current!=null||previous==null))return null;
  if(status!='new'&&status!='left'&&(current==null||previous==null))return null;
  final c=value['clickDelta'],i=value['impressionsDelta'],p=value['positionImprovement'];
  if(status=='new'||status=='left'){
   if(c!=null||i!=null||p!=null)return null;
  }else if(c is! int||i is! int||p is! num||!p.isFinite)return null;
  return CeoGscMovement(label:label,status:status,current:current,previous:previous,
   clickDelta:c is int?c:null,impressionsDelta:i is int?i:null,
   positionImprovement:p is num?p.toDouble():null);
 }
}
class CeoGscMovementGroup {
 final List<CeoGscMovement> gainers,decliners,steady,newInTop,leftTop;
 const CeoGscMovementGroup({this.gainers=const [],this.decliners=const [],
  this.steady=const [],this.newInTop=const [],this.leftTop=const []});
 static CeoGscMovementGroup? parse(Object? value){
  if(value is! Map<String,dynamic>)return null;
  List<CeoGscMovement> read(String name){
   final raw=value[name];
   if(raw is! List)return const [];
   return raw.map(CeoGscMovement.parse).whereType<CeoGscMovement>()
    .take(10).toList(growable:false);
  }
  return CeoGscMovementGroup(
   gainers:read('gainers'),decliners:read('decliners'),steady:read('steady'),
   newInTop:read('newInTop'),leftTop:read('leftTop'));
 }
}
class CeoGscChangeTotals {
 final int clicksDelta,impressionsDelta;
 final double ctrPointsDelta,positionImprovement;
 final double? clicksPercentChange,impressionsPercentChange;
 const CeoGscChangeTotals({required this.clicksDelta,required this.impressionsDelta,
  required this.ctrPointsDelta,required this.positionImprovement,
  this.clicksPercentChange,this.impressionsPercentChange});
 static CeoGscChangeTotals? parse(Object? value){
  if(value is! Map<String,dynamic>)return null;
  final c=value['clicksDelta'],i=value['impressionsDelta'],
   ctr=value['ctrPointsDelta'],position=value['positionImprovement'];
  if(c is! int||i is! int||ctr is! num||position is! num||
   !ctr.isFinite||!position.isFinite)return null;
  double? percentage(String key){
   final raw=value[key];
   return raw is num&&raw.isFinite?raw.toDouble():null;
  }
  return CeoGscChangeTotals(clicksDelta:c,impressionsDelta:i,
   ctrPointsDelta:ctr.toDouble(),positionImprovement:position.toDouble(),
   clicksPercentChange:percentage('clicksPercentChange'),
   impressionsPercentChange:percentage('impressionsPercentChange'));
 }
}
class CeoGscComparison {
 final String startDate,endDate;
 final CeoGscMetrics? metrics;
 final CeoGscChangeTotals? totals;
 final CeoGscMovementGroup keywords,pages;
 const CeoGscComparison({required this.startDate,required this.endDate,
  this.metrics,this.totals,this.keywords=const CeoGscMovementGroup(),
  this.pages=const CeoGscMovementGroup()});
 static CeoGscComparison? parse(Object? value){
  if(value is! Map<String,dynamic>)return null;
  final start=value['startDate'],end=value['endDate'];
  final re=RegExp(r'^\d{4}-\d{2}-\d{2}$');
  if(start is! String||end is! String||
   !re.hasMatch(start)||!re.hasMatch(end)||start.compareTo(end)>0)return null;
  return CeoGscComparison(startDate:start,endDate:end,
   metrics:CeoGscMetrics.parse(value['metrics']),
   totals:CeoGscChangeTotals.parse(value['totals']),
   keywords:CeoGscMovementGroup.parse(value['keywords'])??const CeoGscMovementGroup(),
   pages:CeoGscMovementGroup.parse(value['pages'])??const CeoGscMovementGroup());
 }
}

class CeoGscReport {
 final String status,period,site,startDate,endDate,timezone,oauthStatus;
 final CeoGscMetrics? metrics;
 final CeoGscComparison? comparison;
 final List<CeoGscDay> daily;
 final List<CeoGscRank> queries,pages;
 const CeoGscReport({required this.status,required this.period,
  required this.site,required this.startDate,required this.endDate,
  required this.timezone,this.oauthStatus='unconfigured',this.metrics,this.daily=const [],
  this.queries=const [],this.pages=const [],this.comparison});
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
   comparison:CeoGscComparison.parse(json['comparison']),
   daily:parse('daily',CeoGscDay.parse),
   queries:parse('queries',CeoGscRank.parse).take(10).toList(growable:false),
   pages:parse('pages',CeoGscRank.parse).take(10).toList(growable:false),
  );
 }
}

 // SEO06: only known, non-sensitive OAuth callback status values are displayed.
// Google authorization code/state and tokens must never reach Flutter.
String gscOAuthResultMessage(String? status)=>switch(status){
 'connected'=>'Google đã hoàn tất bước cấp quyền. CEO đang xác minh và tải dữ liệu Search Console.',
 'cancelled'=>'Google chưa cấp quyền. Có thể kết nối lại từ CEO khi anh sẵn sàng.',
 'invalid'=>'Phiên kết nối Google bị mất hoặc hết hạn khi quay về CEO. Vui lòng thử kết nối lại.',
 'config'=>'Cấu hình OAuth trên máy chủ CEO chưa hợp lệ. Cần kiểm tra Client ID, Secret và khóa mã hóa.',
 'login'=>'Phiên xác thực Owner đã hết hạn trong lúc kết nối Google. Vui lòng đăng nhập CEO rồi thử lại.',
 'permission'=>'Tài khoản Google đã cấp quyền nhưng không có quyền đọc property fbmn.vn đang cấu hình. Kiểm tra quyền trong Search Console.',
 'token'=>'Google không cấp được token cho CEO. Cần kiểm tra OAuth Client ID/Secret, Redirect URI và quyền được cấp.',
 'google_api'=>'Đã cấp quyền Google nhưng CEO chưa xác minh được property Search Console qua API. Vui lòng thử lại.',
 'storage'=>'Google đã cấp quyền nhưng CEO chưa lưu được kết nối vào Neon. Cần kiểm tra quyền database của CEO.',
 'error'=>'CEO gặp lỗi khi hoàn tất kết nối Google. Vui lòng kết nối lại sau khi kiểm tra cấu hình.',
 _=>'',
};
