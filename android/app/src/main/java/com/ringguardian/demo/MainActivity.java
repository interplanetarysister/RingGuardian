package com.ringguardian.demo;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.net.Uri;

public class MainActivity extends Activity {
 private WebView view;
 @Override public void onCreate(Bundle savedInstanceState) {
   super.onCreate(savedInstanceState);
   String origin = BuildConfig.BASE44_URL;
   Uri url = Uri.parse(origin);
   if (!"https".equals(url.getScheme()) || url.getHost() == null) {
     throw new IllegalStateException("Verified Remotebetrayal Base44 deployment URL required");
   }
   view = new WebView(this);
   view.getSettings().setJavaScriptEnabled(true);
   view.getSettings().setDomStorageEnabled(true);
   view.setWebViewClient(new WebViewClient());
   view.setWebChromeClient(new WebChromeClient());
   setContentView(view);
   view.loadUrl(origin);
 }
 @Override public void onBackPressed() {
   if (view != null && view.canGoBack()) view.goBack();
   else super.onBackPressed();
 }
}
