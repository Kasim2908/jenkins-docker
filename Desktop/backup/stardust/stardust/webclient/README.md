Stardust — Web Client (local preview)

Quick start (Windows cmd):

1) Start a local static server (background):

start "" /B python -m http.server 8000 --directory "c:\Users\Acer\Desktop\backup\stardust\stardust\webclient"

2) Open the site in your default browser:

start http://localhost:8000/

3) Stop the server:

- If started in foreground: Ctrl+C in the terminal where it runs.
- If started backgrounded: find the Python PID and kill it, e.g. in cmd:
  tasklist | findstr python
  taskkill /PID <pid> /F

Notes:
- The client loads many resources from external CDNs (web.wwtassets.org, cdnjs, maxcdn, etc.). A working internet connection is required for full functionality.
- Some .aspx endpoints in the repository are server-side pages that require an ASP.NET host (IIS/IIS Express) to run server logic; the static server will only serve those files as static text.

If you want, I can add a small PowerShell or batch file to start/stop the server for you.