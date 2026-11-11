import 'dart:js_interop';
@JS('fbmnPushStatus')
external JSPromise<JSString> _status();
@JS('fbmnPushEnable')
external JSPromise<JSString> _enable();
@JS('fbmnPushDisable')
external JSPromise<JSString> _disable();
Future<String> status()async=>(await _status().toDart).toDart;
Future<String> enable()async=>(await _enable().toDart).toDart;
Future<String> disable()async=>(await _disable().toDart).toDart;
