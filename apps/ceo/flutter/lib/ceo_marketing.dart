import 'package:flutter/material.dart';
import 'ceo_stats_models.dart';
import 'ceo_gsc_models.dart';
import 'ceo_dashboard_charts.dart';
import 'ceo_ui_tokens.dart';
import 'ceo_workspace.dart';

/// PH02: First-touch channels and approved UTM campaign codes only.
class CeoMarketingPanel extends StatelessWidget{
 final CeoMarketingOverview stats;
 final CeoGscReport? gsc;
 final bool gscLoading;
 final String gscError;
 final VoidCallback? onGscRetry;
 const CeoMarketingPanel({super.key,required this.stats,this.gsc,
  this.gscLoading=false,this.gscError='',this.onGscRetry});
 String change(int current,int previous){
  if(previous==0)return '—';
  final value=(current-previous)/previous*100;
  return '${value>0?"+":""}${value.toStringAsFixed(1)}%';
 }
 Widget gscSummary(){
  final report=gsc;
  final metrics=report?.metrics;
  final delta=report?.comparison?.totals;
  return CeoPanel(key:const ValueKey('ceo-ph03-gsc'),
   title:'PH03 · Google Search Console',
   subtitle:'Dữ liệu tìm kiếm Google Web · không phải phiên Website',
   icon:Icons.travel_explore_outlined,
   child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
    if(gscLoading)const LinearProgressIndicator(minHeight:2,color:ceoPurple),
    if(gscError.isNotEmpty)...[
     Text(gscError,style:const TextStyle(fontSize:12,color:Color(0xFFB45309))),
     if(onGscRetry!=null)Align(alignment:Alignment.centerLeft,
      child:TextButton.icon(onPressed:onGscRetry,
       icon:const Icon(Icons.refresh,size:17),label:const Text('Thử lại GSC')))
    ]else if(!gscLoading&&report==null)
     const Text('Đang chờ dữ liệu Search Console.',
      style:TextStyle(fontSize:12,color:ceoMuted))
    else if(!gscLoading&&report?.configured!=true)
     const Text('Search Console chưa kết nối. Mở tab SEO để kiểm tra OAuth.',
      style:TextStyle(fontSize:12,color:ceoMuted))
    else if(!gscLoading&&metrics==null)
     const Text('Google chưa trả đủ dữ liệu trong kỳ này.',
      style:TextStyle(fontSize:12,color:ceoMuted))
    else if(metrics!=null)...[
     Wrap(spacing:16,runSpacing:10,children:[
      _gscMetric('Nhấp',metrics.clicks.toString()),
      _gscMetric('Hiển thị',metrics.impressions.toString()),
      _gscMetric('CTR','${metrics.ctrPercent.toStringAsFixed(2)}%'),
      _gscMetric('Vị trí TB',metrics.position.toStringAsFixed(1)),
     ]),
     const SizedBox(height:8),
     Text(delta==null?'Kỳ trước: chưa đủ dữ liệu so sánh':
      'So kỳ trước: ${delta.clicksDelta>0?"+":""}${delta.clicksDelta} nhấp · '
      '${delta.impressionsDelta>0?"+":""}${delta.impressionsDelta} hiển thị · '
      'CTR ${delta.ctrPointsDelta.toStringAsFixed(2)} điểm %',
      style:const TextStyle(fontSize:12,color:ceoMuted)),
     if(report!=null)Text('GSC: ${report.startDate} – ${report.endDate} (PT)',
      style:const TextStyle(fontSize:11.5,color:ceoMuted)),
    ],
    const SizedBox(height:10),
    const Text('Lượt nhấp GSC không cộng vào phiên PostHog; không được suy ra khách hoặc lead từ một lượt nhấp. '
     'Dữ liệu GSC final trễ 3 ngày, còn PostHog theo phiên trong kỳ đang chạy.',
     style:TextStyle(fontSize:12,color:ceoMuted))
   ]));
 }
 Widget _gscMetric(String label,String value)=>Column(
  mainAxisSize:MainAxisSize.min,crossAxisAlignment:CrossAxisAlignment.start,children:[
   Text(label,style:const TextStyle(fontSize:11.5,color:ceoMuted)),
   Text(value,style:const TextStyle(fontSize:17,fontWeight:FontWeight.w800,color:ceoPurple))
  ]);
 String label(String channel)=>switch(channel){
  'google_organic'=>'Google tự nhiên',
  'google_paid'=>'Google Ads',
  'google_unclassified'=>'Google chưa phân loại',
  'facebook'=>'Facebook / Instagram',
  'zalo'=>'Zalo',
  'direct'=>'Trực tiếp',
  'referral'=>'Giới thiệu',
  _=>'Nguồn khác'
 };
 String ratio(double? value)=>value==null?'—':'${value.toStringAsFixed(1)}%';
 Widget channelRow(CeoMarketingRow row)=>Padding(
  padding:const EdgeInsets.symmetric(vertical:10),
  child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   Row(children:[
    Expanded(child:Text(label(row.channel),overflow:TextOverflow.ellipsis,
     style:const TextStyle(fontSize:13,fontWeight:FontWeight.w700,color:ceoInk))),
    const SizedBox(width:8),
    Text('${row.sessions} phiên',style:const TextStyle(fontSize:13,color:ceoPurple,
     fontWeight:FontWeight.w700)),
   ]),
   const SizedBox(height:5),
   Text('Xem SP: ${row.productSessions} · Bấm liên hệ: ${row.ctaSessions} · Gửi thành công: ${row.leadSessions}',
    style:const TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:3),
   Text('Kỳ trước: ${stats.previousFor(row.channel)?.sessions??0} phiên · '
    'Biến động: ${change(row.sessions,stats.previousFor(row.channel)?.sessions??0)}',
    style:const TextStyle(fontSize:12,color:ceoMuted)),
   const SizedBox(height:6),
   LinearProgressIndicator(
    value:stats.sessions==0?0:row.sessions/stats.sessions,
    minHeight:6,color:ceoPurple,backgroundColor:ceoLavender),
   const SizedBox(height:3),
   Text('Chuyển đổi: ${ratio(row.leadRatePercent)} · Liên hệ: ${row.contactSessions} · Gia công: ${row.outsourcingSessions}',
    style:const TextStyle(fontSize:12,color:ceoMuted)),
  ]));
 Widget campaignRow(CeoMarketingRow row)=>Padding(
  padding:const EdgeInsets.symmetric(vertical:10),
  child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   Row(children:[
    Expanded(child:Text(row.campaign,overflow:TextOverflow.ellipsis,
     style:const TextStyle(fontSize:13,fontWeight:FontWeight.w700,color:ceoInk))),
    const SizedBox(width:8),
    Text('${row.sessions} phiên',style:const TextStyle(fontSize:13,color:ceoPurple,
     fontWeight:FontWeight.w700)),
   ]),
   const SizedBox(height:4),
   Text('${label(row.channel)} · ${row.leadSessions} phiên gửi yêu cầu · ${ratio(row.leadRatePercent)}',
    style:const TextStyle(fontSize:12,color:ceoMuted)),
  ]));
 @override Widget build(BuildContext context)=>Column(children:[
  gscSummary(),
  CeoPanel(title:'PH03 · Hiệu quả và biến động kênh',
   subtitle:'PostHog · so sánh hai kỳ liên tiếp cùng số ngày',
   icon:Icons.analytics_outlined,
   child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
    Wrap(spacing:18,runSpacing:12,children:[
     _gscMetric('Phiên Website','${stats.sessions}'),
     _gscMetric('Phiên có lead','${stats.leadSessions}'),
     _gscMetric('Tỷ lệ tạo lead',ratio(stats.leadRatePercent)),
    ]),
    const SizedBox(height:8),
    Text('So kỳ trước: phiên ${change(stats.sessions,stats.previousSessions)} '
     '(${stats.previousSessions}) · lead ${change(stats.leadSessions,stats.previousLeadSessions)} '
     '(${stats.previousLeadSessions})',
     style:const TextStyle(fontSize:12.5,color:ceoInk)),
    const SizedBox(height:12),
    CeoMarketingTrend(stats:stats),
   ])),
  CeoPanel(title:'PH02 · Hiệu quả nguồn khách',subtitle:'Nguồn đầu tiên trong phiên · dữ liệu PostHog',
   icon:Icons.campaign_outlined,
   child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
    const Text('Đếm theo phiên Website (không phải khách duy nhất). Một phiên có liên hệ hoặc gia công thành công được tính là một phiên tạo yêu cầu.',
     style:TextStyle(fontSize:12,color:ceoMuted)),
    const SizedBox(height:12),
    Wrap(spacing:12,runSpacing:8,children:[
     Text('Tổng phiên: ${stats.sessions}',style:const TextStyle(fontWeight:FontWeight.w700,color:ceoInk)),
     Text('Phiên gửi yêu cầu: ${stats.leadSessions}',style:const TextStyle(fontWeight:FontWeight.w700,color:ceoInk)),
     Text('Tỷ lệ: ${ratio(stats.leadRatePercent)}',
      style:const TextStyle(fontWeight:FontWeight.w700,color:ceoPurple)),
    ]),
    const SizedBox(height:8),
    if(stats.channels.isEmpty)const CeoEmptyResult(
     title:'Chưa có dữ liệu phân kênh',
     detail:'Số liệu sẽ xuất hiện khi Website nhận phiên truy cập có theo dõi.',
     icon:Icons.hub_outlined)
    else for(final row in stats.channels)...[
     const Divider(height:1,color:ceoBorder),channelRow(row)
    ],
    const SizedBox(height:8),
    const Text('Tỷ lệ = phiên có yêu cầu thành công / tổng phiên của kênh. Không phải tỷ lệ Funnel PH01, doanh thu hoặc số đơn hàng.',
     style:TextStyle(fontSize:12,color:ceoMuted)),
   ])),
  CeoPanel(title:'Chiến dịch UTM',subtitle:'Chỉ mã fbmn-* hợp lệ · tối đa 10 nhóm',
   icon:Icons.sell_outlined,child:stats.campaigns.isEmpty?
    const CeoEmptyResult(title:'Chưa có chiến dịch UTM được ghi nhận',
     detail:'Chỉ hiển thị khi khách đến từ chiến dịch có mã utm_campaign hợp lệ.',
     icon:Icons.campaign_outlined):
    Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
     for(final row in stats.campaigns)...[
      const Divider(height:1,color:ceoBorder),campaignRow(row)
     ],
     const SizedBox(height:8),
     const Text('Không hiển thị mã click quảng cáo, truy vấn tìm kiếm hoặc thông tin khách hàng.',
      style:TextStyle(fontSize:12,color:ceoMuted)),
    ])),
 ]);
}
