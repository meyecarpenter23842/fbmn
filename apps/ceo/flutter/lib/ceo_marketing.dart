import 'package:flutter/material.dart';
import 'ceo_stats_models.dart';
import 'ceo_ui_tokens.dart';
import 'ceo_workspace.dart';

/// PH02: First-touch channels and approved UTM campaign codes only.
class CeoMarketingPanel extends StatelessWidget{
 final CeoMarketingOverview stats;
 const CeoMarketingPanel({super.key,required this.stats});
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
