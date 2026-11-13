import 'package:flutter_test/flutter_test.dart';
import 'package:futurebook_ceo/ceo_stats_models.dart';

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

}
