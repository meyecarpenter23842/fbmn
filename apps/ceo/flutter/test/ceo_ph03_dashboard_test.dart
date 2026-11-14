import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:futurebook_ceo/ceo_stats_models.dart';
import 'package:futurebook_ceo/ceo_gsc_models.dart';
import 'package:futurebook_ceo/ceo_dashboard_charts.dart';
import 'package:futurebook_ceo/ceo_marketing.dart';

void main(){
 final stats=CeoMarketingOverview.fromJson({
  'channels':[
   {'channel':'google_organic','sessions':10,'productSessions':6,
    'ctaSessions':4,'leadSessions':2,'contactSessions':2,'outsourcingSessions':0},
   {'channel':'facebook','sessions':5,'productSessions':3,
    'ctaSessions':2,'leadSessions':1,'contactSessions':0,'outsourcingSessions':1}
  ],
  'previousChannels':[
   {'channel':'google_organic','sessions':8,'productSessions':3,
    'ctaSessions':2,'leadSessions':1,'contactSessions':1,'outsourcingSessions':0}
  ],
  'campaigns':[],
  'daily':[
   {'day':'2026-11-12','channel':'google_organic','sessions':4,'leadSessions':1},
   {'day':'2026-11-13','channel':'google_organic','sessions':6,'leadSessions':1},
   {'day':'2026-11-13','channel':'facebook','sessions':5,'leadSessions':1},
  ]
 });
 test('PH03 prior periods and source trends parse independently of GSC',(){
  expect(stats.sessions,15);
  expect(stats.leadSessions,3);
  expect(stats.previousSessions,8);
  expect(stats.previousLeadSessions,1);
  expect(stats.sessionsChangePercent,87.5);
  expect(stats.leadsChangePercent,200.0);
  expect(stats.previousFor('google_organic')!.sessions,8);
  expect(stats.previousFor('facebook'),isNull);
  expect(stats.daily.length,3);
  expect(stats.daily.last.leadSessions,1);
  const empty=CeoMarketingOverview();
  expect(empty.sessionsChangePercent,isNull);
  expect(empty.leadsChangePercent,isNull);
 });
 final gsc=CeoGscReport.fromJson({
  'status':'ready','period':'7d','startDate':'2026-11-04','endDate':'2026-11-10',
  'metrics':{'clicks':25,'impressions':400,'ctr':0.0625,'position':12.8},
  'comparison':{'startDate':'2026-10-28','endDate':'2026-11-03',
   'totals':{'clicksDelta':4,'impressionsDelta':50,'ctrPointsDelta':1.3,'positionImprovement':1.2}}
 });
 for(final width in <double>[360,390,1280]){
  testWidgets('PH03 Marketing/GSC and source chart are responsive at $width',(tester)async{
   await tester.binding.setSurfaceSize(Size(width,850));
   await tester.pumpWidget(MaterialApp(home:Scaffold(
    body:SingleChildScrollView(child:SizedBox(width:width,child:
     CeoMarketingPanel(stats:stats,gsc:gsc))))));
   await tester.pumpAndSettle();
   expect(find.byKey(const ValueKey('ceo-ph03-gsc')),findsOneWidget);
   expect(find.text('25'),findsWidgets);
   expect(find.byKey(const ValueKey('ceo-ph03-trend-chart')),findsOneWidget);
   expect(find.textContaining('không cộng vào phiên PostHog'),findsOneWidget);
   expect(tester.takeException(),isNull);
   await tester.pumpWidget(const SizedBox.shrink());
   await tester.binding.setSurfaceSize(null);
  });
 }
 testWidgets('Interactive channel time series reports real selected day',(tester)async{
  await tester.binding.setSurfaceSize(const Size(390,680));
  await tester.pumpWidget(MaterialApp(home:Scaffold(
   body:CeoMarketingTrend(stats:stats))));
  await tester.pumpAndSettle();
  expect(find.byKey(const ValueKey('ceo-ph03-trend-selected')),findsOneWidget);
  expect(find.textContaining('2026-11-13'),findsOneWidget);
  await tester.tap(find.byType(CustomPaint).last);
  await tester.pumpAndSettle();
  expect(tester.takeException(),isNull);
  await tester.binding.setSurfaceSize(null);
 });
}
