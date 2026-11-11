import 'package:flutter/material.dart';
const ceoPurple=Color(0xFF6D249E);
const ceoCanvas=Color(0xFFF7F8FC);
const ceoBadgeRed=Color(0xFFDC2626);
const ceoInk=Color(0xFF242034);
const ceoMuted=Color(0xFF697386);
const ceoBorder=Color(0xFFE5D7F1);
const ceoLavender=Color(0xFFF4EDFA);
const ceoDesktopButtonHeight=36.0,ceoMobileButtonHeight=44.0;
const ceoInputHeight=40.0,ceoControlFontSize=13.0,ceoRadius=9.0;
const ceoMotion=Duration(milliseconds:190);
ThemeData ceoTheme(double viewportWidth){
 final height=viewportWidth<=780?ceoMobileButtonHeight:ceoDesktopButtonHeight;
 final buttonStyle=ButtonStyle(
  minimumSize:WidgetStatePropertyAll(Size(0,height)),
  textStyle:const WidgetStatePropertyAll(TextStyle(fontSize:ceoControlFontSize,fontWeight:FontWeight.w600)),
  shape:WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius:BorderRadius.circular(ceoRadius))),
  animationDuration:ceoMotion);
 return ThemeData(useMaterial3:true,scaffoldBackgroundColor:ceoCanvas,
  colorScheme:ColorScheme.fromSeed(seedColor:ceoPurple),
  filledButtonTheme:FilledButtonThemeData(style:buttonStyle),
  outlinedButtonTheme:OutlinedButtonThemeData(style:buttonStyle),
  textButtonTheme:TextButtonThemeData(style:buttonStyle),
  inputDecorationTheme:InputDecorationTheme(
   filled:true,fillColor:Colors.white,isDense:true,
   contentPadding:const EdgeInsets.symmetric(horizontal:12,vertical:9),
   constraints:const BoxConstraints(minHeight:ceoInputHeight),
   border:OutlineInputBorder(borderRadius:BorderRadius.circular(ceoRadius))),
  navigationBarTheme:const NavigationBarThemeData(
   labelTextStyle:WidgetStatePropertyAll(TextStyle(fontSize:ceoControlFontSize))),
  cardTheme:CardThemeData(elevation:0,color:Colors.white,
   shadowColor:const Color(0x1A312345),
   shape:RoundedRectangleBorder(borderRadius:BorderRadius.circular(16),
     side:const BorderSide(color:Color(0xFFE5D7F1)))));
}
