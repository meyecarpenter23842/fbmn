import 'dart:js_interop';
@JS('window.location.assign')
external void _assign(JSString value);
void navigateGoogleConsent(String url)=>_assign(url.toJS);
