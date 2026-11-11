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
void main(){
 testWidgets('Anonymous session cannot see any Owner inbox', (tester)async{
  await tester.pumpWidget(CeoApp(repository:FakeRepo(false)));
  await tester.pumpAndSettle();
  expect(find.text('Bảng điều hành CEO'),findsOneWidget);
  expect(find.text('Đăng nhập'),findsOneWidget);
  expect(find.text('Hội thoại'),findsNothing);
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
