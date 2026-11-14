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
