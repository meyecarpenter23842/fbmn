import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:futurebook_ceo/ceo_indexing_models.dart';
import 'package:futurebook_ceo/ceo_indexing.dart';
import 'package:futurebook_ceo/ceo_repository.dart';

class _FakeRepo extends Fake implements CeoRepository{}

const _url='https://www.fbmn.vn/san-pham/sku-949cacde498fb835f2a00f2b6f72567d';
const _catalogue='https://www.fbmn.vn/catalogue';

Map<String,dynamic> watchFixture()=>{
 'source':'gsc_initial_nonindexed_report',
 'baselineDate':'2026-11-18',
 'note':'Danh sách ưu tiên; chưa phải trạng thái index mới nhất.',
 'sitemap':'https://www.fbmn.vn/sitemap.xml',
 'schedule':[
  {'days':7,'dueDate':'2026-11-25'},
  {'days':14,'dueDate':'2026-12-02'},
  {'days':30,'dueDate':'2026-12-18'}
 ],
 'urls':[
  {'key':'P003','label':'SKU P003','url':_url},
  {'key':'catalogue','label':'Catalogue','url':_catalogue}
 ]
};
Map<String,dynamic> resultFixture()=>{
 'key':'P003','label':'SKU P003','url':_url,
 'checkedAt':'2026-11-18T09:00:00Z',
 'google':{
  'status':'ready','source':'google_url_inspection_indexed_version',
  'indexed':false,'verdict':'FAIL',
  'coverage':'Crawled - currently not indexed',
  'lastCrawlTime':'2026-11-10T10:00:00.000Z',
  'userCanonical':_url,'userCanonicalMatches':true,
  'googleCanonical':null,'googleCanonicalMatches':null
 },
 'performance':{
  'status':'ready','endDate':'2026-11-14',
  'windows':[
   {'days':7,'clicks':1,'impressions':10},
   {'days':14,'clicks':1,'impressions':12},
   {'days':30,'clicks':2,'impressions':20}
  ]
 },
 'technical':{
  'http':{'status':200,'noindex':false,'canonicalMatches':true},
  'sitemap':{'status':'ready','included':true},
  'ready':true
 }
};
void main(){
 test('P3 models preserve numeric 0-prefix SKU and do not invent Google verdict',(){
  final watch=CeoP3Watchlist.fromJson(watchFixture());
  expect(watch.urls.length,2);
  expect(watch.urls.first.key,'P003');
  expect(watch.schedule.map((v)=>v.days).toList(),[7,14,30]);
  final result=CeoP3Audit.fromJson(resultFixture());
  expect(result.indexed,false);
  expect(result.indexedLabel,'Google chưa lập chỉ mục');
  expect(result.technicalReady,true);
  expect(result.performance.map((v)=>v.days).toList(),[7,14,30]);
  expect(result.performance.first.impressions,10);
  final unknown=resultFixture();
  unknown['google']={'status':'rate_limited'};
  unknown['performance']={'status':'unavailable'};
  final notChecked=CeoP3Audit.fromJson(unknown);
  expect(notChecked.indexed,isNull);
  expect(notChecked.indexedLabel,'Google đang giới hạn lượt tra cứu');
  expect(notChecked.performance,isEmpty);
 });
 test('P3 model rejects outside URLs and malformed GSC records',(){
  final data=watchFixture();
  (data['urls'] as List)[0]={'key':'P003','label':'Bad','url':'https://evil.example/'};
  expect(()=>CeoP3Watchlist.fromJson(data),throwsFormatException);
  final invalid=resultFixture();
  invalid['technical']={'http':null,'sitemap':null};
  expect(()=>CeoP3Audit.fromJson(invalid),throwsFormatException);
 });
 testWidgets('P3 stays in its scrollable SEO panel at 360, 390 and desktop widths',(tester)async{
  for(final width in <double>[360,390,1280,1440]){
   await tester.binding.setSurfaceSize(Size(width,840));
   final visited=<String>[];
   await tester.pumpWidget(MaterialApp(home:Scaffold(body:
    SingleChildScrollView(child:Padding(
     padding:const EdgeInsets.all(8),
     child:CeoP3IndexingPanel(
      api:_FakeRepo(),
      loadWatchlist:()async=>CeoP3Watchlist.fromJson(watchFixture()),
      inspectUrl:(key)async{
       visited.add(key);
       return CeoP3Audit.fromJson(resultFixture());
      },
     ))))));
   await tester.pumpAndSettle();
   expect(find.byKey(const ValueKey('ceo-p3-url-P003')),findsOneWidget);
   expect(find.byKey(const ValueKey('ceo-p3-url-catalogue')),findsOneWidget);
   expect(find.textContaining('Mốc 14 ngày'),findsOneWidget);
   await tester.ensureVisible(find.byKey(const ValueKey('ceo-p3-inspect-P003')));
   await tester.tap(find.byKey(const ValueKey('ceo-p3-inspect-P003')));
   await tester.pumpAndSettle();
   expect(visited,['P003']);
   expect(find.byKey(const ValueKey('ceo-p3-result-P003')),findsOneWidget);
   expect(find.textContaining('Google chưa lập chỉ mục'),findsOneWidget);
   expect(find.textContaining('Kỹ thuật Website đạt'),findsOneWidget);
   expect(find.textContaining('30 ngày'),findsWidgets);
   expect(tester.takeException(),isNull);
   await tester.pumpWidget(const SizedBox.shrink());
  }
  await tester.binding.setSurfaceSize(null);
 });
}
