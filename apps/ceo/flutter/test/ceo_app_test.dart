import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:futurebook_ceo/main.dart';
import 'package:futurebook_ceo/ceo_models.dart';
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

void main(){
 testWidgets('Anonymous session cannot see any Owner inbox', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakeRepo(false)));
  await tester.pumpAndSettle();
  expect(find.text('Bảng điều hành CEO'),findsOneWidget);
  expect(find.text('Đăng nhập'),findsOneWidget);
  expect(find.text('Hội thoại'),findsNothing);
 });

 testWidgets('CEO bell and menu tabs show red numeric badge only for new requests', (tester)async{
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
  expect(find.text('3 yêu cầu mới'),findsOneWidget);
  expect(find.text('Web Push trên thiết bị'),findsOneWidget);
  expect(find.text('Gia công · Khách thử'),findsNWidgets(2));
  expect(find.text('Liên hệ · Khách thử'),findsOneWidget);

  await tester.tap(find.text('Liên hệ · Khách thử'));
  await tester.pumpAndSettle();
  expect(find.text('Chi tiết liên hệ'),findsOneWidget);
 });

 testWidgets('CEO bell hides number when no status-new requests exist', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakeRepo(true)));
  await tester.pumpAndSettle();
  final bell=find.byTooltip('Xem thông báo và yêu cầu mới');
  expect(bell,findsOneWidget);
  expect(find.descendant(of:bell,matching:find.byType(Badge)),findsNothing);
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
  expect(find.textContaining('Không hiển thị số liệu mẫu'),findsOneWidget);
 });
}
