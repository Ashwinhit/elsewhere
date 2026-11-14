.class Lorg/apogeans/elsewhere/MainActivity$Chrome;
.super Landroid/webkit/WebChromeClient;

.field final act:Lorg/apogeans/elsewhere/MainActivity;

.method constructor <init>(Lorg/apogeans/elsewhere/MainActivity;)V
    .registers 2
    invoke-direct {p0}, Landroid/webkit/WebChromeClient;-><init>()V
    iput-object p1, p0, Lorg/apogeans/elsewhere/MainActivity$Chrome;->act:Lorg/apogeans/elsewhere/MainActivity;
    return-void
.end method

.method public onGeolocationPermissionsShowPrompt(Ljava/lang/String;Landroid/webkit/GeolocationPermissions$Callback;)V
    .registers 4
    iget-object v0, p0, Lorg/apogeans/elsewhere/MainActivity$Chrome;->act:Lorg/apogeans/elsewhere/MainActivity;
    invoke-virtual {v0, p1, p2}, Lorg/apogeans/elsewhere/MainActivity;->askLocation(Ljava/lang/String;Landroid/webkit/GeolocationPermissions$Callback;)V
    return-void
.end method

.method public onShowFileChooser(Landroid/webkit/WebView;Landroid/webkit/ValueCallback;Landroid/webkit/WebChromeClient$FileChooserParams;)Z
    .registers 6
    iget-object v0, p0, Lorg/apogeans/elsewhere/MainActivity$Chrome;->act:Lorg/apogeans/elsewhere/MainActivity;
    invoke-virtual {v0, p2, p3}, Lorg/apogeans/elsewhere/MainActivity;->pickFile(Landroid/webkit/ValueCallback;Landroid/webkit/WebChromeClient$FileChooserParams;)Z
    move-result v1
    return v1
.end method

.method public onPermissionRequest(Landroid/webkit/PermissionRequest;)V
    .registers 3
    iget-object v0, p0, Lorg/apogeans/elsewhere/MainActivity$Chrome;->act:Lorg/apogeans/elsewhere/MainActivity;
    invoke-virtual {v0, p1}, Lorg/apogeans/elsewhere/MainActivity;->askCamera(Landroid/webkit/PermissionRequest;)V
    return-void
.end method
