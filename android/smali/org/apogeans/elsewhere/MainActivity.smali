.class public Lorg/apogeans/elsewhere/MainActivity;
.super Landroid/app/Activity;

.field private web:Landroid/webkit/WebView;
.field geoOrigin:Ljava/lang/String;
.field geoCb:Landroid/webkit/GeolocationPermissions$Callback;
.field fileCb:Landroid/webkit/ValueCallback;
.field camReq:Landroid/webkit/PermissionRequest;

.method public constructor <init>()V
    .registers 1
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .registers 6
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V
    invoke-virtual {p0}, Lorg/apogeans/elsewhere/MainActivity;->getWindow()Landroid/view/Window;
    move-result-object v0
    const v1, -0xf8f6f4
    invoke-virtual {v0, v1}, Landroid/view/Window;->setStatusBarColor(I)V
    const v2, -0xf5f2ef
    invoke-virtual {v0, v2}, Landroid/view/Window;->setNavigationBarColor(I)V
    new-instance v0, Landroid/webkit/WebView;
    invoke-direct {v0, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lorg/apogeans/elsewhere/MainActivity;->web:Landroid/webkit/WebView;
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setBackgroundColor(I)V
    const/4 v2, 0x2
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setOverScrollMode(I)V
    invoke-virtual {v0}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;
    move-result-object v2
    const/4 v3, 0x1
    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V
    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V
    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setGeolocationEnabled(Z)V
    const/4 v3, 0x0
    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setMixedContentMode(I)V
    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setAllowFileAccess(Z)V
    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setMediaPlaybackRequiresUserGesture(Z)V
    new-instance v2, Lorg/apogeans/elsewhere/MainActivity$Client;
    invoke-direct {v2, p0}, Lorg/apogeans/elsewhere/MainActivity$Client;-><init>(Lorg/apogeans/elsewhere/MainActivity;)V
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V
    new-instance v2, Lorg/apogeans/elsewhere/MainActivity$Chrome;
    invoke-direct {v2, p0}, Lorg/apogeans/elsewhere/MainActivity$Chrome;-><init>(Lorg/apogeans/elsewhere/MainActivity;)V
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V
    new-instance v2, Lorg/apogeans/elsewhere/MainActivity$Bridge;
    invoke-direct {v2, p0}, Lorg/apogeans/elsewhere/MainActivity$Bridge;-><init>(Lorg/apogeans/elsewhere/MainActivity;)V
    const-string v3, "AndroidBridge"
    invoke-virtual {v0, v2, v3}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V
    invoke-virtual {p0, v0}, Lorg/apogeans/elsewhere/MainActivity;->setContentView(Landroid/view/View;)V
    if-nez p1, :restore
    const-string v2, "https://appassets.androidplatform.net/index.html"
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    return-void
    :restore
    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->restoreState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;
    move-result-object v2
    if-nez v2, :done
    const-string v2, "https://appassets.androidplatform.net/index.html"
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    :done
    return-void
.end method

.method protected onSaveInstanceState(Landroid/os/Bundle;)V
    .registers 3
    invoke-super {p0, p1}, Landroid/app/Activity;->onSaveInstanceState(Landroid/os/Bundle;)V
    iget-object v0, p0, Lorg/apogeans/elsewhere/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :done
    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->saveState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;
    :done
    return-void
.end method

.method public onBackPressed()V
    .registers 3
    iget-object v0, p0, Lorg/apogeans/elsewhere/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :up
    invoke-virtual {v0}, Landroid/webkit/WebView;->canGoBack()Z
    move-result v1
    if-eqz v1, :up
    invoke-virtual {v0}, Landroid/webkit/WebView;->goBack()V
    return-void
    :up
    invoke-super {p0}, Landroid/app/Activity;->onBackPressed()V
    return-void
.end method

.method public askLocation(Ljava/lang/String;Landroid/webkit/GeolocationPermissions$Callback;)V
    .registers 7
    const-string v0, "android.permission.ACCESS_COARSE_LOCATION"
    invoke-virtual {p0, v0}, Lorg/apogeans/elsewhere/MainActivity;->checkSelfPermission(Ljava/lang/String;)I
    move-result v1
    if-nez v1, :ask
    const/4 v1, 0x1
    const/4 v2, 0x0
    invoke-interface {p2, p1, v1, v2}, Landroid/webkit/GeolocationPermissions$Callback;->invoke(Ljava/lang/String;ZZ)V
    return-void
    :ask
    iput-object p1, p0, Lorg/apogeans/elsewhere/MainActivity;->geoOrigin:Ljava/lang/String;
    iput-object p2, p0, Lorg/apogeans/elsewhere/MainActivity;->geoCb:Landroid/webkit/GeolocationPermissions$Callback;
    const/4 v1, 0x2
    new-array v1, v1, [Ljava/lang/String;
    const/4 v2, 0x0
    const-string v3, "android.permission.ACCESS_FINE_LOCATION"
    aput-object v3, v1, v2
    const/4 v2, 0x1
    aput-object v0, v1, v2
    invoke-virtual {p0, v1, v2}, Lorg/apogeans/elsewhere/MainActivity;->requestPermissions([Ljava/lang/String;I)V
    return-void
.end method

.method public onRequestPermissionsResult(I[Ljava/lang/String;[I)V
    .registers 8
    const/4 v0, 0x3
    if-ne p1, v0, :geo
    iget-object v0, p0, Lorg/apogeans/elsewhere/MainActivity;->camReq:Landroid/webkit/PermissionRequest;
    if-eqz v0, :done
    const-string v1, "android.permission.CAMERA"
    invoke-virtual {p0, v1}, Lorg/apogeans/elsewhere/MainActivity;->checkSelfPermission(Ljava/lang/String;)I
    move-result v1
    if-nez v1, :deny
    invoke-virtual {v0}, Landroid/webkit/PermissionRequest;->getResources()[Ljava/lang/String;
    move-result-object v1
    invoke-virtual {v0, v1}, Landroid/webkit/PermissionRequest;->grant([Ljava/lang/String;)V
    goto :clearcam
    :deny
    invoke-virtual {v0}, Landroid/webkit/PermissionRequest;->deny()V
    :clearcam
    const/4 v1, 0x0
    iput-object v1, p0, Lorg/apogeans/elsewhere/MainActivity;->camReq:Landroid/webkit/PermissionRequest;
    goto :done
    :geo
    iget-object v0, p0, Lorg/apogeans/elsewhere/MainActivity;->geoCb:Landroid/webkit/GeolocationPermissions$Callback;
    if-eqz v0, :done
    const-string v1, "android.permission.ACCESS_COARSE_LOCATION"
    invoke-virtual {p0, v1}, Lorg/apogeans/elsewhere/MainActivity;->checkSelfPermission(Ljava/lang/String;)I
    move-result v1
    const/4 v2, 0x0
    if-nez v1, :call
    const/4 v2, 0x1
    :call
    iget-object v1, p0, Lorg/apogeans/elsewhere/MainActivity;->geoOrigin:Ljava/lang/String;
    const/4 v3, 0x0
    invoke-interface {v0, v1, v2, v3}, Landroid/webkit/GeolocationPermissions$Callback;->invoke(Ljava/lang/String;ZZ)V
    const/4 v0, 0x0
    iput-object v0, p0, Lorg/apogeans/elsewhere/MainActivity;->geoCb:Landroid/webkit/GeolocationPermissions$Callback;
    :done
    return-void
.end method

.method public pickFile(Landroid/webkit/ValueCallback;Landroid/webkit/WebChromeClient$FileChooserParams;)Z
    .registers 6
    iget-object v0, p0, Lorg/apogeans/elsewhere/MainActivity;->fileCb:Landroid/webkit/ValueCallback;
    if-eqz v0, :fresh
    const/4 v1, 0x0
    invoke-interface {v0, v1}, Landroid/webkit/ValueCallback;->onReceiveValue(Ljava/lang/Object;)V
    :fresh
    iput-object p1, p0, Lorg/apogeans/elsewhere/MainActivity;->fileCb:Landroid/webkit/ValueCallback;
    :try_start_0
    invoke-virtual {p2}, Landroid/webkit/WebChromeClient$FileChooserParams;->createIntent()Landroid/content/Intent;
    move-result-object v0
    const/16 v1, 0x2a
    invoke-virtual {p0, v0, v1}, Lorg/apogeans/elsewhere/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0
    const/4 v0, 0x1
    return v0
    :catch_0
    const/4 v0, 0x0
    iput-object v0, p0, Lorg/apogeans/elsewhere/MainActivity;->fileCb:Landroid/webkit/ValueCallback;
    const/4 v1, 0x0
    return v1
.end method

.method protected onActivityResult(IILandroid/content/Intent;)V
    .registers 7
    invoke-super {p0, p1, p2, p3}, Landroid/app/Activity;->onActivityResult(IILandroid/content/Intent;)V
    const/16 v0, 0x2a
    if-ne p1, v0, :done
    iget-object v0, p0, Lorg/apogeans/elsewhere/MainActivity;->fileCb:Landroid/webkit/ValueCallback;
    if-eqz v0, :done
    invoke-static {p2, p3}, Landroid/webkit/WebChromeClient$FileChooserParams;->parseResult(ILandroid/content/Intent;)[Landroid/net/Uri;
    move-result-object v1
    invoke-interface {v0, v1}, Landroid/webkit/ValueCallback;->onReceiveValue(Ljava/lang/Object;)V
    const/4 v2, 0x0
    iput-object v2, p0, Lorg/apogeans/elsewhere/MainActivity;->fileCb:Landroid/webkit/ValueCallback;
    :done
    return-void
.end method

.method public askCamera(Landroid/webkit/PermissionRequest;)V
    .registers 6
    const-string v0, "android.permission.CAMERA"
    invoke-virtual {p0, v0}, Lorg/apogeans/elsewhere/MainActivity;->checkSelfPermission(Ljava/lang/String;)I
    move-result v1
    if-nez v1, :ask
    invoke-virtual {p1}, Landroid/webkit/PermissionRequest;->getResources()[Ljava/lang/String;
    move-result-object v2
    invoke-virtual {p1, v2}, Landroid/webkit/PermissionRequest;->grant([Ljava/lang/String;)V
    return-void
    :ask
    iput-object p1, p0, Lorg/apogeans/elsewhere/MainActivity;->camReq:Landroid/webkit/PermissionRequest;
    const/4 v1, 0x1
    new-array v1, v1, [Ljava/lang/String;
    const/4 v2, 0x0
    aput-object v0, v1, v2
    const/4 v2, 0x3
    invoke-virtual {p0, v1, v2}, Lorg/apogeans/elsewhere/MainActivity;->requestPermissions([Ljava/lang/String;I)V
    return-void
.end method
