.class public Lorg/apogeans/elsewhere/MainActivity$Bridge;
.super Ljava/lang/Object;

.field final act:Lorg/apogeans/elsewhere/MainActivity;

.method constructor <init>(Lorg/apogeans/elsewhere/MainActivity;)V
    .registers 2
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lorg/apogeans/elsewhere/MainActivity$Bridge;->act:Lorg/apogeans/elsewhere/MainActivity;
    return-void
.end method

.method public share(Ljava/lang/String;)V
    .registers 5
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    :try_start_0
    new-instance v0, Landroid/content/Intent;
    const-string v1, "android.intent.action.SEND"
    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V
    const-string v1, "text/plain"
    invoke-virtual {v0, v1}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;
    const-string v1, "android.intent.extra.TEXT"
    invoke-virtual {v0, v1, p1}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;
    const-string v1, "Share result"
    invoke-static {v0, v1}, Landroid/content/Intent;->createChooser(Landroid/content/Intent;Ljava/lang/CharSequence;)Landroid/content/Intent;
    move-result-object v0
    iget-object v1, p0, Lorg/apogeans/elsewhere/MainActivity$Bridge;->act:Lorg/apogeans/elsewhere/MainActivity;
    invoke-virtual {v1, v0}, Lorg/apogeans/elsewhere/MainActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0
    :catch_0
    return-void
.end method
