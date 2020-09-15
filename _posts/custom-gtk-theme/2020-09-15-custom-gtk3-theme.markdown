---
layout: post
title: "Custom GTK(3) Theme for each linux application"
date: "2020-09-10 17:09:13 +0200"
tags: [unix, linux, os, ricing]
description: Guide on how to change the gtk theme of a certain application under unix/linux(X)
---
# How to set a custom GTK theme for each application
## TL;DR
**Create a custom dekstop entry which launches the program with custom environment variables**
### Continue reading if you have no idea how to do that and you want to cry
The general process is:  
1. Create a custom desktop application entry for the app(or copy the default one under `/usr/share/applications/<application-name>.desktop`) under `~/.local/share/applications/`
2. Open the file you just copied/created with your favorite editor (_or be a man and open it in vim /s_)
3. Locate the line where it says `Exec:` and then the name of the program.
4. Add `env GTK_THEME=<theme name>` right after `Exec:` and put a space after it. ⚠️ Add the name of the theme, not the path to it. _(Don't ask me how much throubleshooting it took me to find out)_
5. Kill all instances of the program, then relaunch it(with an application launcher, not from the command line)
6. The program should have the theme specified in it. If it doesn't it's because one of these x things:
    1. You don't have the theme specified installed 
    2. You misspelled the theme name 
    3. You are launching the _binary_, not the application entry that we just created
    4. You aren't use vim as your text editor _/s_

## Practical Example with [VSCodium](https://vscodium.com/)
> For reference, VsCodium is the libre version of VsCode, with no telemetry or anything microsoft-related, **you should really switch to it if you are already using vscode and like not being spied on**

1. Copy the desktop entry from `/usr/share/applications/vscodium-bin.desktop`
```
$ cp /usr/share/applications/vscodium-bin.desktop $HOME/.local/share/applications
```
2. Open the file in vim
```
$ vim $HOME/.local/share/applications/vscodium-bin.desktop
```
➜ It should look something like this:

```
[Desktop Entry]
Name=VSCodium
Comment=Code Editing. Redefined.
GenericName=Text Editor
Exec=/usr/share/vscodium-bin/bin/codium --unity-launch %F
Icon=vscodium
Type=Application
StartupNotify=true
StartupWMClass=VSCodium
Categories=Utility;Development;IDE;
MimeType=text/plain;inode/directory;
Actions=new-empty-window;
Keywords=vscode;

[Desktop Action new-empty-window]
Name=New Empty Window
Exec=/usr/share/vscodium-bin/bin/codium --new-window %F
Icon=vscodium
```
3. Edit what's after `Exec:` to make it look like this:

```
[Desktop Entry]
Name=VSCodium
Comment=Code Editing. Redefined.
GenericName=Text Editor
Exec=env GTK_THEME=deepin-dark /usr/share/vscodium-bin/bin/codium --unity-launch %F
Icon=vscodium
Type=Application
StartupNotify=true
StartupWMClass=VSCodium
Categories=Utility;Development;IDE;
MimeType=text/plain;inode/directory;
Actions=new-empty-window;
Keywords=vscode;

[Desktop Action new-empty-window]
Name=New Empty Window
Exec=env GTK_THEME=deepin-dark /usr/share/vscodium-bin/bin/codium --new-window %F
Icon=vscodium
```

4. Kill all instances of that application, then relaunch it

#### Now your application should be using the specified GTK theme

Before:
{:refdef: style="text-align: center;"}
[![before image](/assets/posts/custom-gtk3-theme/before.png)](/assets/posts/custom-gtk3-theme/before.png) <br>
*Ugly white border*
{: refdef}
After:
{:refdef: style="text-align: center;"}
[![after image](/assets/posts/custom-gtk3-theme/after.png)](/assets/posts/custom-gtk3-theme/after.png) <br>
*No more ugly white border, much better cool dark border*
{: refdef}

[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com
