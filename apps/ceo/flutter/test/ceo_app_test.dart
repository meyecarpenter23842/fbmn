import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:futurebook_ceo/main.dart';
import 'package:futurebook_ceo/ceo_models.dart';
import 'package:futurebook_ceo/ceo_mail.dart';
import 'package:futurebook_ceo/ceo_mail_models.dart';
import 'package:futurebook_ceo/ceo_repository.dart';

class FakeRepo implements CeoRepository {
 final bool allowed;
 FakeRepo(this.allowed);
 @override Future<bool> ownerSession()async=>allowed;
 @override Future<void> signIn(String email,String password)async{}
 @override Future<void> signOut()async{}
 @override Future<CeoPage<CeoConversation>> conversations([int page=1])async=>CeoPage([],page,false);
 @override Future<List<CeoTurn>> turns(String session)async=>[];
 @override Future<CeoPage<CeoRequest>> contactRequests([int page=1])async=>CeoPage([],page,false);
 @override Future<CeoPage<CeoRequest>> outsourcingRequests([int page=1])async=>CeoPage([],page,false);
 @override Future<String> markViewed(String kind,String id)async=>'2026-11-11T14:00:00.000Z';
 @override Future<CeoMailPage> mailList(String box,{String? after})async=>
  const CeoMailPage([],null,false);
 @override Future<CeoMailItem> mailDetail(String box,String id)async=>
  const CeoMailItem(id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   from:'sender@example.com',subject:'Thư thử',createdAt:'2026-11-11T14:00:00Z',
   status:'delivered',messageId:'<test@example.com>',text:'Nội dung thử',
   to:['info@fbmn.vn'],attachments:[]);
 @override Future<String> mailSend({required String to,required String subject,
  required String text,String? replyId,String? requestId,
  List<CeoMailAttachment> attachments=const []})async=>'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

 @override void dispose(){}
}

class FakePendingRepo extends FakeRepo {
 FakePendingRepo():super(true);
 CeoRequest item(String id,String status)=>CeoRequest(
  id:id,name:'Khách thử',email:'',phone:'',company:'',province:'',
  customerGroup:'',productType:'',specifications:'',quantity:'',
  desiredDate:'',details:'',message:'',createdAt:'',status:status,
  interests:const []);
 @override Future<CeoPage<CeoRequest>> contactRequests([int page=1])async=>
  CeoPage([item('contact-a','new'),item('contact-b','handled')],page,false);
 @override Future<CeoPage<CeoRequest>> outsourcingRequests([int page=1])async=>
  CeoPage([item('out-a','new'),item('out-b','new')],page,false);
}

class FakeDelayedRequestsRepo extends FakePendingRepo {
 final contactsPending=Completer<CeoPage<CeoRequest>>();
 final outsourcingPending=Completer<CeoPage<CeoRequest>>();
 @override Future<CeoPage<CeoRequest>> contactRequests([int page=1])=>contactsPending.future;
 @override Future<CeoPage<CeoRequest>> outsourcingRequests([int page=1])=>outsourcingPending.future;
 void finishLoading(){
  contactsPending.complete(CeoPage([
   item('contact-a','new'),item('contact-b','handled')],1,false));
  outsourcingPending.complete(CeoPage([
   item('out-a','new'),item('out-b','new')],1,false));
 }
}

class FakePaginatedRepo extends FakePendingRepo {
 final nextPage=Completer<CeoPage<CeoRequest>>();
 @override Future<CeoPage<CeoRequest>> contactRequests([int page=1]) async {
  if(page>1)return nextPage.future;
  return CeoPage([item('contact-a','new')],1,true);
 }
 void finishSecondPage(){
  nextPage.complete(CeoPage([item('contact-c','new')],2,false));
 }
}


class FakeChatRepo extends FakeRepo {
 FakeChatRepo():super(true);
 @override Future<CeoPage<CeoConversation>> conversations([int page=1])async=>CeoPage([
  const CeoConversation(session:'aabbccdd-0000-0000-0000-000000000001',
   createdAt:'2026-11-11T12:00:00Z',updatedAt:'2026-11-11T12:10:00Z',
   latest:'Khách muốn hỏi mẫu bìa',messageCount:1),
 ],page,false);
 @override Future<List<CeoTurn>> turns(String session)async=>[
  const CeoTurn(question:'Cho tôi xem mẫu bìa giấy',
   answer:'Vui lòng xem catalogue của Futurebook.',
   createdAt:'2026-11-11T12:00:00Z'),
 ];
}


class FakeMailRepo extends FakePendingRepo {
 int fetches=0;
 @override Future<CeoMailPage> mailList(String box,{String? after})async{
  fetches++;
  return
  CeoMailPage([CeoMailItem(
   id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   from:box=='inbox'?'Đại lý <sender@example.com>':'Futurebook <info@fbmn.vn>',
   subject:'Yêu cầu catalogue',createdAt:'2026-11-11T14:00:00Z',
   status:box=='inbox'?'':'delivered',messageId:'<test@example.com>',
   text:'Nội dung thử',to:box=='inbox'?const ['info@fbmn.vn']:
   const ['sender@example.com'],attachments:const [],
  )],null,false);
 }
}
void main(){
 testWidgets('CEO-MAIL03 compose includes removable attachments control on narrow screens',(tester)async{
  await tester.binding.setSurfaceSize(const Size(360,740));
  await tester.pumpWidget(MaterialApp(home:Scaffold(body:
   CeoMailComposer(api:FakeRepo(true)))));
  await tester.pumpAndSettle();
  expect(find.text('Đính kèm tệp'),findsOneWidget);
  expect(find.textContaining('3 MB'),findsOneWidget);
  expect(tester.takeException(),isNull);
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.binding.setSurfaceSize(null);
 });

 testWidgets('Anonymous session cannot see any Owner inbox', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakeRepo(false)));
  await tester.pumpAndSettle();
  expect(find.text('Bảng điều hành CEO'),findsOneWidget);
  expect(find.text('Đăng nhập'),findsOneWidget);
  expect(find.text('Hội thoại'),findsNothing);
 });

 testWidgets('CEO bell and menu tabs show red numeric badge only for new unviewed requests', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakePendingRepo()));
  await tester.pumpAndSettle();

  final bell=find.byTooltip('Xem thông báo và yêu cầu mới');
  expect(bell,findsOneWidget);
  final badgeWithinBell=find.descendant(of:bell,matching:find.byType(Badge));
  expect(badgeWithinBell,findsOneWidget);
  expect(find.descendant(of:bell,matching:find.text('3')),findsOneWidget);
  expect(tester.widget<Badge>(badgeWithinBell).backgroundColor,const Color(0xFFDC2626));

  final allRedBadges=tester.widgetList<Badge>(find.byType(Badge))
    .where((badge)=>badge.backgroundColor==const Color(0xFFDC2626)).length;
  expect(allRedBadges,3); // bell + Gia công + Liên hệ; no invented chat unread.
 });
 testWidgets('Tapping bell opens new requests without changing push permission', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakePendingRepo()));
  await tester.pumpAndSettle();

  await tester.tap(find.byTooltip('Xem thông báo và yêu cầu mới'));
  await tester.pumpAndSettle();

  expect(find.text('Thông báo & yêu cầu mới'),findsOneWidget);
  expect(find.text('3 yêu cầu chưa xem'),findsOneWidget);
  expect(find.text('Web Push trên thiết bị'),findsOneWidget);
  expect(find.text('Gia công · Khách thử'),findsNWidgets(2));
  expect(find.text('Liên hệ · Khách thử'),findsOneWidget);

  await tester.tap(find.text('Liên hệ · Khách thử'));
  await tester.pumpAndSettle();
  expect(find.text('Chi tiết liên hệ'),findsOneWidget);
 });

 testWidgets('Open bell before requests finish loading updates visible count', (tester)async{
  final repo=FakeDelayedRequestsRepo();
  await tester.pumpWidget(CeoApp(repository:repo));
  await tester.pump();
  await tester.pump();

  await tester.tap(find.byTooltip('Xem thông báo và yêu cầu mới'));
  await tester.pump(const Duration(milliseconds:350));
  expect(find.text('0 yêu cầu chưa xem'),findsOneWidget);

  repo.finishLoading();
  await tester.pump();
  await tester.pumpAndSettle();
  expect(find.text('3 yêu cầu chưa xem'),findsOneWidget);
 });

 testWidgets('Bell updates when a second request page finishes loading', (tester)async{
  final repo=FakePaginatedRepo();
  await tester.pumpWidget(CeoApp(repository:repo));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Liên hệ').last);
  await tester.pumpAndSettle();

  await tester.tap(find.text('Tải trang tiếp'));
  await tester.pump();
  await tester.tap(find.byTooltip('Xem thông báo và yêu cầu mới'));
  await tester.pump(const Duration(milliseconds:350));
  expect(find.text('3 yêu cầu chưa xem'),findsOneWidget);

  repo.finishSecondPage();
  await tester.pump();
  await tester.pumpAndSettle();
  expect(find.text('4 yêu cầu chưa xem'),findsOneWidget);
 });

 testWidgets('Viewing request clears Owner badge but retains Mới workflow status', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakePendingRepo()));
  await tester.pumpAndSettle();
  final bell=find.byTooltip('Xem thông báo và yêu cầu mới');
  expect(find.descendant(of:bell,matching:find.text('3')),findsOneWidget);
  await tester.tap(bell);
  await tester.pumpAndSettle();
  await tester.tap(find.text('Liên hệ · Khách thử'));
  await tester.pumpAndSettle();
  expect(find.text('Chi tiết liên hệ'),findsOneWidget);
  expect(find.text('Mới · chưa xử lý'),findsOneWidget);
  expect(find.text('Đã xem'),findsWidgets);
  expect(find.descendant(of:bell,matching:find.text('2')),findsOneWidget);
  await tester.tap(find.byTooltip('Đóng chi tiết'));
  await tester.pumpAndSettle();
  await tester.tap(bell);
  await tester.pumpAndSettle();
  expect(find.text('2 yêu cầu chưa xem'),findsOneWidget);
  expect(find.text('Liên hệ · Khách thử'),findsNothing);
 });

 testWidgets('CEO bell hides number when no status-new requests exist', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakeRepo(true)));
  await tester.pumpAndSettle();
  final bell=find.byTooltip('Xem thông báo và yêu cầu mới');
  expect(bell,findsOneWidget);
  expect(find.descendant(of:bell,matching:find.byType(Badge)),findsNothing);
 });

 testWidgets('CEO-UI01 mobile workspace has no overflow at 360/390 px', (tester)async{
  for(final width in <double>[360,390]){
   await tester.binding.setSurfaceSize(Size(width,800));
   await tester.pumpWidget(CeoApp(repository:FakePendingRepo()));
   await tester.pumpAndSettle();
   for(final tab in <int>[0,1,2,3]){
    final nav=tester.widget<NavigationBar>(find.byType(NavigationBar));
    nav.onDestinationSelected!(tab);
    await tester.pumpAndSettle();
    expect(tester.takeException(),isNull,
     reason:'Unexpected Flutter overflow at width $width tab $tab');
   }
   final search=find.byKey(const ValueKey('ceo-workspace-search'));
   expect(search,findsOneWidget);
   await tester.enterText(search,'khong-co-khach-hang');
   await tester.pumpAndSettle();
   expect(find.text('Không tìm thấy yêu cầu'),findsOneWidget);
   expect(tester.takeException(),isNull);
   await tester.pumpWidget(const SizedBox.shrink());
  }
  await tester.binding.setSurfaceSize(null);
 });


 testWidgets('CEO-UI01 desktop workspace fits 1280/1440 without overflow', (tester)async{
  for(final width in <double>[1280,1440]){
   await tester.binding.setSurfaceSize(Size(width,900));
   await tester.pumpWidget(CeoApp(repository:FakePendingRepo()));
   await tester.pumpAndSettle();
   for(final tab in <int>[0,1,2,3]){
    final rail=tester.widget<NavigationRail>(find.byType(NavigationRail));
    rail.onDestinationSelected!(tab);
    await tester.pumpAndSettle();
    expect(tester.takeException(),isNull,
     reason:'Unexpected Flutter overflow at desktop width $width tab $tab');
   }
   await tester.pumpWidget(const SizedBox.shrink());
  }
  await tester.binding.setSurfaceSize(null);
 });

 testWidgets('CEO-UI01 status filter keeps original pending states', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakePendingRepo()));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Liên hệ').last);
  await tester.pumpAndSettle();
  expect(find.text('Khách thử'),findsNWidgets(2));
  await tester.tap(find.byKey(const ValueKey('ceo-filter-handled')));
  await tester.pumpAndSettle();
  expect(find.text('Khách thử'),findsOneWidget);
  expect(find.text('Đã xử lý'),findsWidgets);
  await tester.tap(find.byKey(const ValueKey('ceo-filter-new')));
  await tester.pumpAndSettle();
  expect(find.text('Khách thử'),findsOneWidget);
  expect(find.text('Mới'),findsWidgets);
 });

 testWidgets('CEO-UI01 chat detail shows customer and assistant bubbles', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakeChatRepo()));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Hội thoại').last);
  await tester.pumpAndSettle();
  expect(find.text('Tìm mã phiên hoặc tin nhắn gần nhất'),findsOneWidget);
  await tester.tap(find.textContaining('Phiên aabbccdd'));
  await tester.pumpAndSettle();
  expect(find.text('Khách hàng'),findsOneWidget);
  expect(find.text('Trợ lý Futurebook'),findsOneWidget);
  expect(find.text('Cho tôi xem mẫu bìa giấy'),findsOneWidget);
 });


 testWidgets('CEO-MAIL01 shows inbox and sent tabs on 360px mobile', (tester)async{
  await tester.binding.setSurfaceSize(const Size(360,800));
  await tester.pumpWidget(CeoApp(repository:FakeMailRepo()));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Liên hệ').last);
  await tester.pumpAndSettle();
  expect(find.byKey(const ValueKey('ceo-contact-requests')),findsOneWidget);
  await tester.tap(find.byKey(const ValueKey('ceo-contact-inbox')));
  await tester.pumpAndSettle();
  expect(find.text('Hộp thư đến'),findsWidgets);
  expect(find.text('Yêu cầu catalogue'),findsOneWidget);
  await tester.tap(find.text('Yêu cầu catalogue'));
  await tester.pumpAndSettle();
  expect(find.text('Nội dung thử'),findsOneWidget);
  expect(find.text('Trả lời'),findsOneWidget);
  expect(tester.takeException(),isNull);
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.binding.setSurfaceSize(null);
 });

 testWidgets('CEO-MAIL01 global header refresh reloads visible mailbox', (tester)async{
  final repo=FakeMailRepo();
  await tester.pumpWidget(CeoApp(repository:repo));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Liên hệ').last);
  await tester.pumpAndSettle();
  await tester.tap(find.byKey(const ValueKey('ceo-contact-inbox')));
  await tester.pumpAndSettle();
  final before=repo.fetches;
  await tester.tap(find.byTooltip('Tải lại dữ liệu'));
  await tester.pumpAndSettle();
  expect(repo.fetches,greaterThan(before));
 });

 testWidgets('CEO-MAIL01 notification shortcut returns to customer requests from either mailbox', (tester)async{
  for(final mailbox in const <String>['inbox','sent']){
   await tester.pumpWidget(CeoApp(repository:FakeMailRepo()));
   await tester.pumpAndSettle();
   await tester.tap(find.text('Liên hệ').last);
   await tester.pumpAndSettle();
   await tester.tap(find.byKey(ValueKey('ceo-contact-$mailbox')));
   await tester.pumpAndSettle();
   expect(tester.widget<ChoiceChip>(
    find.byKey(ValueKey('ceo-contact-$mailbox'))).selected,isTrue);
   await tester.tap(find.byTooltip('Xem thông báo và yêu cầu mới'));
   await tester.pumpAndSettle();
   final shortcut=find.text('Xem tất cả liên hệ');
   // The notification sheet uses a lazily built ListView: the last shortcut
   // is not in the widget tree until the sheet scrolls to it.
   await tester.scrollUntilVisible(shortcut,180,
    scrollable:find.byType(Scrollable).last);
   await tester.tap(shortcut);
   await tester.pumpAndSettle();
   expect(tester.widget<ChoiceChip>(
    find.byKey(const ValueKey('ceo-contact-requests'))).selected,isTrue);
   expect(find.text('Khách thử'),findsNWidgets(2));
   expect(tester.takeException(),isNull);
   await tester.pumpWidget(const SizedBox.shrink());
   await tester.pumpAndSettle();
  }
 });

 testWidgets('CEO-MAIL02 opens the exact inbound email from a push target', (tester)async{
  final key=GlobalKey<CeoMailPanelState>();
  await tester.pumpWidget(MaterialApp(home:Scaffold(body:
   CeoMailPanel(key:key,api:FakeMailRepo(),box:'inbox'))));
  await tester.pumpAndSettle();
  final opening=key.currentState!.openMailById('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  await tester.pumpAndSettle();
  expect(find.text('Chi tiết thư đến'),findsOneWidget);
  expect(find.text('Nội dung thử'),findsOneWidget);
  expect(find.text('Trả lời'),findsOneWidget);
  await tester.tap(find.byTooltip('Đóng chi tiết'));
  await tester.pumpAndSettle();
  await opening;
 });

 testWidgets('CEO-MAIL01 supports compose dialog and provider sent list', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakeMailRepo()));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Liên hệ').last);
  await tester.pumpAndSettle();
  await tester.tap(find.byKey(const ValueKey('ceo-contact-sent')));
  await tester.pumpAndSettle();
  expect(find.text('Thư đã gửi'),findsWidgets);
  await tester.tap(find.text('Soạn thư'));
  await tester.pumpAndSettle();
  expect(find.text('Soạn email Futurebook'),findsOneWidget);
  expect(find.textContaining('logo'),findsOneWidget);
  expect(tester.takeException(),isNull);
 });

 testWidgets('Owner sees five tabs, no invented analytics', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakeRepo(true)));
  await tester.pumpAndSettle();
  expect(find.byType(NavigationBar),findsOneWidget);
  expect(find.text('Tổng quan'),findsWidgets);
  expect(find.text('Hội thoại'),findsWidgets);
  expect(find.text('Gia công'),findsWidgets);
  expect(find.text('Liên hệ'),findsWidgets);
  await tester.tap(find.text('Thống kê').last);
  await tester.pumpAndSettle();
  expect(find.textContaining('Chỉ hiển thị số liệu sau khi kết nối'),findsOneWidget);
 });
}
