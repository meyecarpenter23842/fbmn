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
