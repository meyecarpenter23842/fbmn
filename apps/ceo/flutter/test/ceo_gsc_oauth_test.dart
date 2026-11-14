import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:futurebook_ceo/ceo_search_console.dart';
import 'package:futurebook_ceo/ceo_gsc_models.dart';

const disconnected=CeoGscReport(
 status:'unconfigured',period:'7d',site:'www.fbmn.vn',
 startDate:'',endDate:'',timezone:'America/Los_Angeles',oauthStatus:'disconnected');
const noClient=CeoGscReport(
 status:'unconfigured',period:'7d',site:'www.fbmn.vn',
 startDate:'',endDate:'',timezone:'America/Los_Angeles',oauthStatus:'unconfigured');
const active=CeoGscReport(
 status:'ready',period:'7d',site:'www.fbmn.vn',
 startDate:'2026-11-04',endDate:'2026-11-10',
 timezone:'America/Los_Angeles',oauthStatus:'connected',
 metrics:CeoGscMetrics(clicks:10,impressions:100,ctr:.1,position:9));

void main(){

 test('SEO06 presents concrete sanitized Google OAuth callback outcomes',(){
  for(final status in const [
   'connected','cancelled','invalid','config','login','permission',
   'token','google_api','storage','error'
  ]){
   expect(gscOAuthResultMessage(status),isNotEmpty,reason:status);
  }
  expect(gscOAuthResultMessage('permission'),contains('property fbmn.vn'));
  expect(gscOAuthResultMessage('storage'),contains('Neon'));
  expect(gscOAuthResultMessage('token'),contains('OAuth Client'));
  expect(gscOAuthResultMessage('invalid'),contains('Phiên kết nối'));
  expect(gscOAuthResultMessage('connected'),contains('hoàn tất'));
  expect(gscOAuthResultMessage('unknown'),isEmpty);
  expect(gscOAuthResultMessage(null),isEmpty);
 });


 testWidgets('Expired Google grant offers reconnect and disconnect instead of endless retry',(tester)async{
  await tester.pumpWidget(MaterialApp(home:Scaffold(body:CeoGscPanel(
   report:null,loading:false,reconnectRequired:true,
   error:'Quyền Google đã hết hạn',
   retry:(){},onConnect:(){},onDisconnect:(){},
  ))));
  expect(find.byKey(const ValueKey('gsc-reconnect-google')),findsOneWidget);
  expect(find.byKey(const ValueKey('gsc-disconnect-google')),findsOneWidget);
  expect(find.text('Thử tải lại Search Console'),findsNothing);
 });
 testWidgets('Connected Google shows error if disconnect operation fails',(tester)async{
  await tester.pumpWidget(MaterialApp(home:Scaffold(body:SingleChildScrollView(child:CeoGscPanel(
   report:active,loading:false,error:'',
   connectionError:'Không thể ngắt kết nối. Vui lòng thử lại.',
   retry:(){},onConnect:(){},onDisconnect:(){},
  )))));
  await tester.pumpAndSettle();
  expect(find.text('Không thể ngắt kết nối. Vui lòng thử lại.'),findsOneWidget);
  expect(find.byKey(const ValueKey('gsc-disconnect-google')),findsOneWidget);
 });


 testWidgets('SEO06B shows real property-wide KPI, keywords/pages, and honest empty state',(tester)async{
  final report=CeoGscReport(
   status:'ready',period:'7d',site:'fbmn.vn',oauthStatus:'connected',
   startDate:'2026-11-04',endDate:'2026-11-10',timezone:'America/Los_Angeles',
   metrics:const CeoGscMetrics(clicks:31,impressions:400,ctr:.0775,position:12.1),
   queries:const [CeoGscRank('tập vở học sinh',
    CeoGscMetrics(clicks:10,impressions:50,ctr:.2,position:8))],
   pages:const [CeoGscRank('fbmn.vn/',
    CeoGscMetrics(clicks:5,impressions:80,ctr:.0625,position:11))],
  );
  await tester.pumpWidget(MaterialApp(home:Scaffold(
   body:SingleChildScrollView(child:CeoGscPanel(
    report:report,loading:false,error:'',retry:(){},onConnect:(){},onDisconnect:(){})))));
  await tester.pumpAndSettle();
  expect(find.textContaining('property fbmn.vn'),findsOneWidget);
  expect(find.text('Lượt nhấp'),findsOneWidget);
  expect(find.text('Hiển thị'),findsOneWidget);
  expect(find.text('tập vở học sinh'),findsOneWidget);
  expect(find.text('fbmn.vn/'),findsOneWidget);
  await tester.pumpWidget(MaterialApp(home:Scaffold(
   body:SingleChildScrollView(child:CeoGscPanel(
    report:CeoGscReport(status:'ready',period:'7d',site:'fbmn.vn',
     startDate:'2026-11-04',endDate:'2026-11-10',
     timezone:'America/Los_Angeles',oauthStatus:'connected'),
    loading:false,error:'',retry:(){},onConnect:(){},onDisconnect:(){})))));
  await tester.pumpAndSettle();
  expect(find.textContaining('30 hoặc 90 ngày'),findsOneWidget);
  expect(tester.takeException(),isNull);
 });


 testWidgets('SEO07 displays real period gains/declines and no fabricated zeros',(tester)async{
  const metric=CeoGscMetrics(clicks:12,impressions:200,ctr:.06,position:8);
  const older=CeoGscMetrics(clicks:10,impressions:100,ctr:.1,position:12);
  final current=CeoGscReport(
   status:'ready',period:'7d',site:'fbmn.vn',oauthStatus:'connected',
   startDate:'2026-11-04',endDate:'2026-11-10',timezone:'America/Los_Angeles',
   metrics:metric,
   comparison:CeoGscComparison(startDate:'2026-10-28',endDate:'2026-11-03',
    metrics:older,
    totals:const CeoGscChangeTotals(clicksDelta:2,impressionsDelta:100,
     ctrPointsDelta:-4.0,positionImprovement:4.0),
    keywords:const CeoGscMovementGroup(gainers:[
     CeoGscMovement(label:'tập học sinh',status:'up',clickDelta:3,
      impressionsDelta:12,positionImprovement:2,
      current:CeoGscRank('tập học sinh',metric),
      previous:CeoGscRank('tập học sinh',older))],
     newInTop:[CeoGscMovement(label:'sổ tay',status:'new',
      current:CeoGscRank('sổ tay',metric))]),
    pages:const CeoGscMovementGroup(decliners:[
     CeoGscMovement(label:'/',status:'down',clickDelta:-3,
      impressionsDelta:-20,positionImprovement:1,
      current:CeoGscRank('/',metric),previous:CeoGscRank('/',older))])));
  await tester.pumpWidget(MaterialApp(home:Scaffold(
   body:SingleChildScrollView(child:CeoGscPanel(
    report:current,loading:false,error:'',retry:(){},onConnect:(){},onDisconnect:(){})))));
  await tester.pumpAndSettle();
  expect(find.byKey(const ValueKey('ceo-seo07-comparison')),findsOneWidget);
  expect(find.textContaining('So sánh 7 ngày'),findsOneWidget);
  expect(find.text('Từ khóa tăng / giảm'),findsOneWidget);
  expect(find.text('Trang tăng / giảm'),findsOneWidget);
  expect(find.text('tập học sinh'),findsOneWidget);
  expect(find.text('sổ tay'),findsOneWidget);
  expect(find.text('Mới trong top 10'),findsWidgets);
  expect(tester.takeException(),isNull);
  await tester.pumpWidget(const SizedBox.shrink());
 });

 for(final width in <double>[360,390,1280]){
  testWidgets('SEO06 OAuth connect and disconnect controls at $width',(tester)async{
   await tester.binding.setSurfaceSize(Size(width,820));
   var connectedCalls=0,disconnectCalls=0;
   Future<void> pump(CeoGscReport r)async{
    await tester.pumpWidget(MaterialApp(home:Scaffold(
     body:SingleChildScrollView(child:CeoGscPanel(report:r,loading:false,
      error:'',retry:(){},onConnect:()=>connectedCalls++,
      onDisconnect:()=>disconnectCalls++)))));
    await tester.pumpAndSettle();
   }
   await pump(disconnected);
   expect(find.byKey(const ValueKey('gsc-connect-google')),findsOneWidget);
   expect(find.byKey(const ValueKey('gsc-disconnect-google')),findsNothing);
   await tester.tap(find.byKey(const ValueKey('gsc-connect-google')));
   expect(connectedCalls,1);
   await pump(noClient);
   expect(find.byKey(const ValueKey('gsc-connect-google')),findsNothing);
   await pump(active);
   expect(find.byKey(const ValueKey('ceo-gsc-ready')),findsOneWidget);
   expect(find.byKey(const ValueKey('gsc-disconnect-google')),findsOneWidget);
   await tester.ensureVisible(find.byKey(const ValueKey('gsc-disconnect-google')));
   await tester.tap(find.byKey(const ValueKey('gsc-disconnect-google')));
   expect(disconnectCalls,1);
   expect(tester.takeException(),isNull);
   await tester.pumpWidget(const SizedBox.shrink());
   await tester.binding.setSurfaceSize(null);
  });
 }
}
