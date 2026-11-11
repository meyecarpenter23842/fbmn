import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:futurebook_ceo/ceo_repository.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

const jwt='eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.signature';
http.Response json(int status,Object payload)=>http.Response(jsonEncode(payload),status,
 headers:{'content-type':'application/json'});

void main(){
 test('Owner sign-in gets ephemeral Neon token then confirms Worker grant',()async{
  final calls=<String>[];
  final repo=CeoApi(client:MockClient((r)async{
   calls.add(r.method+' '+r.url.path);
   switch(r.url.path){
    case '/api/auth/sign-in/email':
     expect(r.method,'POST');
     return json(200,{'data':{'user':{'id':'example'}}});
    case '/api/auth/token':
     expect(r.method,'GET');
     return json(200,{'token':jwt});
    case '/api/ceo/session':
     expect(r.headers['authorization'],'Bearer '+jwt);
     return json(200,{'data':{'role':'owner'}});
    case '/api/ceo/contact-requests':
     expect(r.headers['authorization'],'Bearer '+jwt);
     return json(200,{'data':{'requests':[], 'page':1,'hasMore':false}});
    default:throw StateError('Unknown route '+r.url.path);
   }
  }));
  await repo.signIn('owner@example.test','example');
  expect(await repo.ownerSession(),true);
  expect((await repo.contactRequests()).items,isEmpty);
  expect(calls.where((x)=>x=='GET /api/auth/token').length,3);
  repo.dispose();
 });
 test('Missing browser token means unauthenticated, not missing Owner grant',()async{
  final repo=CeoApi(client:MockClient((r)async{
   if(r.url.path=='/api/auth/sign-in/email')return json(200,{'data':{}});
   if(r.url.path=='/api/auth/token')return json(401,{'error':'unauthenticated'});
   throw StateError('Do not query Worker without JWT');
  }));
  await expectLater(repo.signIn('owner@example.test','pw'),
   throwsA(isA<CeoApiException>().having((e)=>e.status,'status',401)));
  repo.dispose();
 });
 test('True Worker role denial remains 403',()async{
  final repo=CeoApi(client:MockClient((r)async{
   if(r.url.path=='/api/auth/token')return json(200,{'data':{'token':jwt}});
   if(r.url.path=='/api/ceo/session')return json(403,{'error':{'code':'forbidden'}});
   throw StateError('Unknown route');
  }));
  await expectLater(repo.ownerSession(),
   throwsA(isA<CeoApiException>().having((e)=>e.status,'status',403)));
  repo.dispose();
 });
 test('Malformed JWT never reaches Owner Worker',()async{
  final repo=CeoApi(client:MockClient((r)async{
   if(r.url.path=='/api/auth/token')return json(200,{'data':{'token':'nope'}});
   throw StateError('No Worker calls allowed');
  }));
  expect(await repo.ownerSession(),false);
  repo.dispose();
 });
}
