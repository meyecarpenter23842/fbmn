import 'dart:js_interop';
@JS('window.location.assign')
external void _assign(JSString value);
void navigateGoogleConsent(String url)=>_assign(url.toJS);

@JS('window.open')
external JSAny? _googleWindow(JSString url,JSString target,JSString features);
void openGoogleInspection(String url){
 final uri=Uri.tryParse(url);
 if(uri==null||uri.scheme!='https'||uri.host!='search.google.com'||
   !uri.path.startsWith('/search-console'))throw ArgumentError('Untrusted Search Console URL');
 _googleWindow(url.toJS,'_blank'.toJS,'noopener,noreferrer'.toJS);
}
