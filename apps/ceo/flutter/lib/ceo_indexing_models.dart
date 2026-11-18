// P3: strongly typed read-only SEO indexing watchlist and inspection results.
// Google indexed-version status is independent from live-site technical checks.
class CeoP3Url{
 final String key,label,url;
 const CeoP3Url(this.key,this.label,this.url);
 factory CeoP3Url.fromJson(Object? raw){
  if(raw is! Map<String,dynamic>)throw const FormatException('Invalid P3 URL');
  final key=raw['key'],label=raw['label'],url=raw['url'];
  if(key is! String||!RegExp(r'^(catalogue|[A-Za-z0-9]{3,6})$').hasMatch(key)||
    label is! String||label.isEmpty||label.length>60||
    url is! String||!RegExp(r'^https://www\.fbmn\.vn/(?:catalogue|san-pham/sku-[a-f0-9]{32})$').hasMatch(url))
   throw const FormatException('Invalid P3 URL');
  return CeoP3Url(key,label,url);
 }
}
class CeoP3Checkpoint{
 final int days;
 final String dueDate;
 const CeoP3Checkpoint(this.days,this.dueDate);
 factory CeoP3Checkpoint.fromJson(Object? raw){
  if(raw is! Map<String,dynamic>||![7,14,30].contains(raw['days'])||
    raw['dueDate'] is! String||
    !RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(raw['dueDate'] as String))
   throw const FormatException('Invalid P3 milestone');
  return CeoP3Checkpoint(raw['days'] as int,raw['dueDate'] as String);
 }
}
class CeoP3Watchlist{
 final String baselineDate,note,sitemap;
 final List<CeoP3Checkpoint> schedule;
 final List<CeoP3Url> urls;
 const CeoP3Watchlist({required this.baselineDate,required this.note,
  required this.sitemap,required this.schedule,required this.urls});
 factory CeoP3Watchlist.fromJson(Map<String,dynamic> raw){
  final items=raw['urls'],schedule=raw['schedule'];
  if(raw['source']!='gsc_initial_nonindexed_report'||
    raw['baselineDate'] is! String||raw['note'] is! String||
    raw['sitemap']!='https://www.fbmn.vn/sitemap.xml'||
    items is! List||items.length>50||items.isEmpty||
    schedule is! List||schedule.length!=3)
   throw const FormatException('Invalid P3 watchlist');
  final urls=items.map(CeoP3Url.fromJson).toList(growable:false);
  if(urls.map((x)=>x.key).toSet().length!=urls.length)
   throw const FormatException('Duplicate P3 URL');
  return CeoP3Watchlist(baselineDate:raw['baselineDate'] as String,
   note:raw['note'] as String,sitemap:raw['sitemap'] as String,
   schedule:schedule.map(CeoP3Checkpoint.fromJson).toList(growable:false),
   urls:urls);
 }
}
class CeoP3Window{
 final int days,clicks,impressions;
 const CeoP3Window(this.days,this.clicks,this.impressions);
 factory CeoP3Window.fromJson(Object? raw){
  if(raw is! Map<String,dynamic>||![7,14,30].contains(raw['days'])||
    raw['clicks'] is! int||raw['impressions'] is! int||
    raw['clicks']<0||raw['impressions']<0)
   throw const FormatException('Invalid P3 performance');
  return CeoP3Window(raw['days'] as int,raw['clicks'] as int,raw['impressions'] as int);
 }
}
class CeoP3Audit{
 final String key,url,checkedAt,googleStatus,performanceStatus,sitemapStatus;
 final String? verdict,coverage,indexingState,fetchState,robotsTxtState,lastCrawlTime,
  googleCanonical,userCanonical,inspectionLink,performanceEnd;
 final bool? indexed,googleCanonicalMatches,userCanonicalMatches,liveCanonicalMatches,hasNoindex,inSitemap;
 final int? httpStatus;
 final bool technicalReady;
 final List<CeoP3Window> performance;
 const CeoP3Audit({
  required this.key,required this.url,required this.checkedAt,
  required this.googleStatus,required this.performanceStatus,required this.sitemapStatus,
  required this.technicalReady,this.verdict,this.coverage,this.indexingState,
  this.fetchState,this.robotsTxtState,this.lastCrawlTime,this.googleCanonical,
  this.userCanonical,this.inspectionLink,this.performanceEnd,this.indexed,
  this.googleCanonicalMatches,this.userCanonicalMatches,this.liveCanonicalMatches,this.hasNoindex,
  this.inSitemap,this.httpStatus,this.performance=const []
 });
 static String? _text(Object? value)=>value is String&&value.isNotEmpty?value:null;
 static bool? _bool(Object? value)=>value is bool?value:null;
 factory CeoP3Audit.fromJson(Map<String,dynamic> raw){
  final g=raw['google'],p=raw['performance'],t=raw['technical'];
  if(raw['key'] is! String||raw['url'] is! String||
    raw['checkedAt'] is! String||DateTime.tryParse(raw['checkedAt'] as String)==null||
    g is! Map<String,dynamic>||p is! Map<String,dynamic>||
    t is! Map<String,dynamic>)
   throw const FormatException('Invalid P3 inspection');
  final h=t['http'],s=t['sitemap'];
  if(h is! Map<String,dynamic>||s is! Map<String,dynamic>||
    g['status'] is! String||p['status'] is! String||
    s['status'] is! String)
   throw const FormatException('Invalid P3 technical check');
  final rawWindows=p['windows'];
  final windows=rawWindows is List?
    rawWindows.map(CeoP3Window.fromJson).take(3).toList(growable:false):
    <CeoP3Window>[];
  return CeoP3Audit(
   key:raw['key'] as String,url:raw['url'] as String,
   checkedAt:raw['checkedAt'] as String,
   googleStatus:g['status'] as String,performanceStatus:p['status'] as String,
   sitemapStatus:s['status'] as String,
   technicalReady:t['ready']==true,
   verdict:_text(g['verdict']),coverage:_text(g['coverage']),
   indexingState:_text(g['indexingState']),fetchState:_text(g['fetchState']),
   robotsTxtState:_text(g['robotsTxtState']),
   lastCrawlTime:_text(g['lastCrawlTime']),
   googleCanonical:_text(g['googleCanonical']),userCanonical:_text(g['userCanonical']),
   inspectionLink:_text(g['inspectionLink']),
   googleCanonicalMatches:_bool(g['googleCanonicalMatches']),
   userCanonicalMatches:_bool(g['userCanonicalMatches']),
   liveCanonicalMatches:_bool(h['canonicalMatches']),
   indexed:_bool(g['indexed']),hasNoindex:_bool(h['noindex']),
   inSitemap:_bool(s['included']),httpStatus:h['status'] is int?h['status'] as int:null,
   performanceEnd:_text(p['endDate']),performance:windows
  );
 }
 String get indexedLabel{
  if(googleStatus!='ready')return switch(googleStatus){
   'disconnected'=>'Chưa kết nối Google',
   'unconfigured'=>'Chưa cấu hình Google',
   'rate_limited'=>'Google đang giới hạn lượt tra cứu',
   'permission_denied'=>'Thiếu quyền URL Inspection',
   'reconnect_required'=>'Cần kết nối lại Google',
   _=>'Google chưa trả được trạng thái'
  };
  return indexed==true?'Google đã lập chỉ mục':
   indexed==false?'Google chưa lập chỉ mục':'Google chưa xác định';
 }
 String get technicalLabel{
  if(technicalReady)return 'Kỹ thuật Website đạt';
  if(httpStatus==null)return 'Chưa kiểm tra được Website';
  if(httpStatus!=200)return 'HTTP $httpStatus';
  if(hasNoindex==true)return 'Trang đang chặn index';
  if(liveCanonicalMatches==false)return 'Canonical Website chưa đúng';
  if(inSitemap==false)return 'Thiếu trong sitemap';
  return 'Cần kiểm tra canonical hoặc sitemap';
 }
}
