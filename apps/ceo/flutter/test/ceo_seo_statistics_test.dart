import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:futurebook_ceo/ceo_stat_controls.dart';
import 'package:futurebook_ceo/ceo_stats_models.dart';
import 'package:futurebook_ceo/ceo_gsc_models.dart';

void main(){
 test('SEO05 parses aggregate sessions and keeps paid traffic separate',(){
  final data=CeoWebStatistics.fromJson({
   'period':'7d','timezone':'UTC','generatedAt':'','metrics':{'visits':4},
   'daily':[{'day':'2026-11-13','visits':4,'pageViews':9,
    'organicSessions':2,'organicLeadSessions':1}],
   'sources':[],'products':[],'categories':[],
   'seo':{'organicSessions':2,'organicProductSessions':2,'organicContactSessions':1,
    'organicOutsourcingSessions':0,'organicLeadSessions':1,
    'googlePaidSessions':1,'googleUnclassifiedSessions':1,'organicCtaClicks':3},
   'seoPages':[{'label':'/san-pham/sku-123','count':2}]
  });
  expect(data.seo.organicSessions,2);
  expect(data.seo.googlePaidSessions,1);
  expect(data.seo.organicCtaClicks,3);
  expect(data.seo.organicLeadSessions,1);
  expect(data.seo.leadRatePercent,50.0);
  expect(data.daily.single.organicSessions,2);
  expect(data.seoPages.single.label,'/san-pham/sku-123');
 });
 test('Without organic sessions there is no valid conversion rate',(){
  const empty=CeoSeoOverview();
  expect(empty.leadRatePercent,isNull);
 });
 test('PH01 reports ordered session conversion and step drop-off',(){
  final f=CeoFunnelOverview.fromJson({
   'viewedSessions':20,'ctaSessions':5,'submittedSessions':2});
  expect(f.viewToCtaPercent,25.0);
  expect(f.ctaToSubmitPercent,40.0);
  expect(f.overallPercent,10.0);
  expect(f.notClicked,15);
  expect(f.notSubmitted,3);
  final response=CeoWebStatistics.fromJson({'funnel':{
   'viewedSessions':20,'ctaSessions':5,'submittedSessions':2}});
  expect(response.funnel.submittedSessions,2);
 });
 test('PH01 does not invent a percentage when the denominator is zero',(){
  const empty=CeoFunnelOverview();
  expect(empty.overallPercent,isNull);
  expect(empty.viewToCtaPercent,isNull);
  expect(empty.ctaToSubmitPercent,isNull);
  final noClicks=CeoFunnelOverview.fromJson({
   'viewedSessions':4,'ctaSessions':0,'submittedSessions':0});
  expect(noClicks.viewToCtaPercent,0.0);
  expect(noClicks.ctaToSubmitPercent,isNull);
  expect(noClicks.overallPercent,0.0);
  expect(CeoFunnelOverview.fromJson({
   'viewedSessions':2,'ctaSessions':3,'submittedSessions':1}).viewedSessions,0);
 });
 test('PH02 maps channel and campaign sessions without inventing rates',(){
  final value=CeoWebStatistics.fromJson({
   'marketing':{
    'channels':[
     {'channel':'google_paid','sessions':12,'productSessions':7,
      'ctaSessions':3,'leadSessions':2,'contactSessions':2,'outsourcingSessions':0},
     {'channel':'facebook','sessions':8,'productSessions':4,
      'ctaSessions':1,'leadSessions':1,'contactSessions':0,'outsourcingSessions':1}],
    'campaigns':[
     {'campaign':'fbmn-november','channel':'google_paid','sessions':5,
      'productSessions':2,'ctaSessions':1,'leadSessions':1}]
   }
  });
  expect(value.marketing.sessions,20);
  expect(value.marketing.leadSessions,3);
  expect(value.marketing.leadRatePercent,15.0);
  expect(value.marketing.channels.first.leadRatePercent,closeTo(16.67,0.01));
  expect(value.marketing.campaigns.single.campaign,'fbmn-november');
  expect(value.marketing.campaigns.single.leadRatePercent,20.0);
 });
 test('PH02 zero sessions do not imply a 0% conversion rate',(){
  const empty=CeoMarketingOverview();
  expect(empty.leadRatePercent,isNull);
  expect(empty.sessions,0);
  expect(empty.leadSessions,0);
 });

 test('SEO06 parses Google clicks, impressions, CTR fraction and average position',(){
  final gsc=CeoGscReport.fromJson({
   'status':'ready','period':'7d','site':'www.fbmn.vn',
   'startDate':'2026-11-04','endDate':'2026-11-10',
   'timezone':'America/Los_Angeles',
   'metrics':{'clicks':31,'impressions':400,'ctr':0.0775,'position':12.1},
   'daily':[{'date':'2026-11-04','clicks':12,'impressions':200,'ctr':0.06,'position':11}],
   'queries':[{'label':'tập học sinh','clicks':8,'impressions':80,'ctr':0.1,'position':5.5}],
   'pages':[{'label':'/san-pham/tap-hoc-sinh','clicks':12,'impressions':60,'ctr':0.2,'position':7}]
  });
  expect(gsc.configured,true);
  expect(gsc.metrics!.clicks,31);
  expect(gsc.metrics!.ctrPercent,7.75);
  expect(gsc.metrics!.position,12.1);
  expect(gsc.daily.length,1);
  expect(gsc.queries.single.label,'tập học sinh');
  expect(gsc.pages.single.metrics.clicks,12);
 });
 test('SEO06 unconfigured and empty Google data do not fabricate zeros',(){
  final missing=CeoGscReport.fromJson({
   'status':'unconfigured','period':'30d','metrics':null
  });
  expect(missing.configured,false);
  expect(missing.metrics,isNull);
  final noData=CeoGscReport.fromJson({
   'status':'ready','period':'7d','metrics':null,
   'daily':[],'queries':[],'pages':[]
  });
  expect(noData.configured,true);
  expect(noData.metrics,isNull);
  expect(CeoGscMetrics.parse({'clicks':-1,'impressions':2,'ctr':0,'position':3}),isNull);
  expect(CeoGscMetrics.parse({'clicks':1,'impressions':2,'ctr':1.2,'position':3}),isNull);
  expect(()=>CeoGscReport.fromJson({'status':'bad'}),throwsFormatException);
 });

 for(final width in <double>[360,390,1280,1440]){
  testWidgets('SEO06B compact filter and secondary tabs at $width',(tester)async{
   await tester.binding.setSurfaceSize(Size(width,820));
   var selectedPeriod='',selectedTab=-1;
   await tester.pumpWidget(MaterialApp(home:Scaffold(body:Column(children:[
    Row(children:[
     CeoStatsPeriodFilter(period:'7d',onChanged:(v)=>selectedPeriod=v),
     const Spacer(),
     const Icon(Icons.refresh),
    ]),
    CeoStatsSubTabs(tabs:const ['Tổng quan','Chuyển đổi','Marketing','Sản phẩm','SEO'],
     selected:0,onChanged:(v)=>selectedTab=v),
   ]))));
   await tester.pumpAndSettle();
   expect(find.byKey(const ValueKey('ceo-stats-period-filter')),findsOneWidget);
   expect(find.byKey(const ValueKey('ceo-stats-subtabs')),findsOneWidget);
   expect(find.byType(ChoiceChip),findsNothing);
   final minTouch=width<=780?44.0:36.0;
   expect(tester.getSize(find.byKey(const ValueKey('ceo-stats-period-30d'))).height,
    greaterThanOrEqualTo(minTouch));
   expect(tester.getSize(find.byKey(const ValueKey('ceo-stats-tab-2'))).height,
    greaterThanOrEqualTo(minTouch));
   await tester.tap(find.byKey(const ValueKey('ceo-stats-period-30d')));
   expect(selectedPeriod,'30d');
   await tester.tap(find.byKey(const ValueKey('ceo-stats-tab-2')));
   expect(selectedTab,2);
   expect(tester.takeException(),isNull);
   await tester.pumpWidget(const SizedBox.shrink());
   await tester.binding.setSurfaceSize(null);
  });
 }

}
