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
}
