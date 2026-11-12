import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:futurebook_ceo/ceo_repository.dart';

const jwt='eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJvd25lciJ9.c2lnbmF0dXJl';

void main(){
 test('Neon cached token 401 is recovered from valid persistent server session',()async{
  var tokens=0,sessions=0;
  final api=CeoApi(client:MockClient((request)async{
   if(request.url.path=='/api/auth/token'){
    tokens++;return http.Response('{"error":"expired_proxy_cache"}',401);
   }
   if(request.url.path=='/api/auth/get-session'){
    sessions++;
    return http.Response('{"session":{"access_token":"$jwt"}}',200);
   }
   if(request.url.path=='/api/ceo/session'){
    expect(request.headers.entries.any((entry)=>
     entry.key.toLowerCase()=='authorization'&&entry.value=='Bearer $jwt'),isTrue);
    return http.Response('{"data":{"role":"owner"}}',200);
   }
   throw StateError('Unexpected request: ${request.url.path}');
  }));
  expect(await api.ownerSession(),true);
  expect(tokens,1);
  expect(sessions,1);
  api.dispose();
 });
 test('Neon session refresh can restore token when get-session has no JWT',()async{
  var calls=0;
  final api=CeoApi(client:MockClient((request)async{
   if(request.url.path=='/api/auth/token'){
    calls++;
    return calls==1?http.Response('{}',401):
     http.Response('{"token":"$jwt"}',200);
   }
   if(request.url.path=='/api/auth/get-session'){
    return http.Response('{"session":{"expiresAt":"2026-12-01T00:00:00Z"}}',200);
   }
   if(request.url.path=='/api/ceo/session')return http.Response('{"data":{"role":"owner"}}',200);
   throw StateError('Unexpected request');
  }));
  expect(await api.ownerSession(),true);
  expect(calls,2);
  api.dispose();
 });
 test('Genuinely revoked session remains unauthenticated and never grants Owner',()async{
  var calls=0;
  final api=CeoApi(client:MockClient((request)async{
   calls++;
   if(request.url.path=='/api/auth/get-session')return http.Response('{"session":null}',200);
   return http.Response('{}',401);
  }));
  expect(await api.ownerSession(),false);
  expect(calls,3);
  api.dispose();
 });
 test('Temporary auth upstream outage must not force an Owner logout',()async{
  final api=CeoApi(client:MockClient((request)async=>
   http.Response('{"error":"network"}',503)));
  await expectLater(api.ownerSession(),throwsA(isA<CeoApiException>()
   .having((e)=>e.status,'status',503)));
  api.dispose();
 });
}
