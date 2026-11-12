import 'dart:js_interop';
@JS('fbmnPushStatus')
external JSPromise<JSString> _status();
@JS('fbmnPushEnable')
external JSPromise<JSString> _enable();
@JS('fbmnPushDisable')
external JSPromise<JSString> _disable();
@JS('fbmnPushLogout')
external JSPromise<JSString> _logout();
Future<String> status()async=>(await _status().toDart).toDart;
Future<String> enable()async=>(await _enable().toDart).toDart;
Future<String> disable()async=>(await _disable().toDart).toDart;

Future<String> logout()async=>(await _logout().toDart).toDart;

@JS('fbmnPushBadge')
external JSPromise<JSString> _badge(JSNumber count);
Future<void> badge(int count)async{
 try{await _badge(count.toJS).toDart;}catch(_){}
}

@JS('fbmnPushTest')
external JSPromise<JSString> _test();
Future<String> test()async=>(await _test().toDart).toDart;
