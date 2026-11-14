.class Lorg/apogeans/elsewhere/MainActivity$Client;
.super Landroid/webkit/WebViewClient;

.field final act:Lorg/apogeans/elsewhere/MainActivity;

.method constructor <init>(Lorg/apogeans/elsewhere/MainActivity;)V
    .registers 2
    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V
    iput-object p1, p0, Lorg/apogeans/elsewhere/MainActivity$Client;->act:Lorg/apogeans/elsewhere/MainActivity;
    return-void
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Ljava/lang/String;)Z
    .registers 6
    const-string v0, "https://appassets.androidplatform.net/"
    invoke-virtual {p2, v0}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z
    move-result v0
    if-nez v0, :inside
    const-string v0, "http"
    invoke-virtual {p2, v0}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z
    move-result v0
    if-nez v0, :external
    :inside
    const/4 v0, 0x0
    return v0
    :external
    :try_start_0
    new-instance v0, Landroid/content/Intent;
    const-string v1, "android.intent.action.VIEW"
    invoke-static {p2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;
    move-result-object v2
    invoke-direct {v0, v1, v2}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V
    iget-object v1, p0, Lorg/apogeans/elsewhere/MainActivity$Client;->act:Lorg/apogeans/elsewhere/MainActivity;
    invoke-virtual {v1, v0}, Lorg/apogeans/elsewhere/MainActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0
    :catch_0
    const/4 v0, 0x1
    return v0
.end method

.method public shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .registers 9
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;
    move-result-object v0
    invoke-virtual {v0}, Landroid/net/Uri;->getHost()Ljava/lang/String;
    move-result-object v1
    const-string v2, "appassets.androidplatform.net"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v1
    if-eqz v1, :none
    invoke-virtual {v0}, Landroid/net/Uri;->getPath()Ljava/lang/String;
    move-result-object v1
    if-eqz v1, :none
    const-string v2, "/"
    invoke-virtual {v1, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v2
    if-eqz v2, :named
    const-string v1, "/index.html"
    :named
    new-instance v2, Ljava/lang/StringBuilder;
    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V
    const-string v3, "www"
    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v2, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v1
    invoke-static {v1}, Ljava/net/URLConnection;->guessContentTypeFromName(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    if-nez v4, :typed
    const-string v4, "application/octet-stream"
    :typed
    :try_start_0
    iget-object v2, p0, Lorg/apogeans/elsewhere/MainActivity$Client;->act:Lorg/apogeans/elsewhere/MainActivity;
    invoke-virtual {v2}, Lorg/apogeans/elsewhere/MainActivity;->getAssets()Landroid/content/res/AssetManager;
    move-result-object v2
    invoke-virtual {v2, v1}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;
    move-result-object v2
    new-instance v3, Landroid/webkit/WebResourceResponse;
    const-string v5, "utf-8"
    invoke-direct {v3, v4, v5, v2}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V
    return-object v3
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :none
    :none
    const/4 v0, 0x0
    return-object v0
.end method
