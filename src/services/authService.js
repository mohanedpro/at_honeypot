export const validateFakeCredentials = (username, password) => {

  const sqliPattern = /(union\s+select|or\s+1\s*=\s*1|--|'|"|\bselect\b|\binsert\b)/i

   // allow this fake SQLi admin' or 1=1  or admin' --  || this fake credentials "admin" & "admin"
  
  const validSqliPatterns = [
        "admin' or 1=1",
        "admin' --",
        "admin' or '1'='1",
        "admin' #"
    ];

  const defaultCreds = [
        { u: 'admin', p: 'letmein123' },
        { u: 'root', p: 'root' }
    ];

  const SQLi = sqliPattern.test(username) || sqliPattern.test(password)

  const vSQLi = validSqliPatterns.includes(username) || validSqliPatterns.includes(password);

  const isDefault = defaultCreds.some( creds => username === creds.u && password === creds.p );

  const userExist = defaultCreds.some( creds => username === creds.u )
  
  if (vSQLi) {
    return {
      success: true,
      mode: 'EXPLOITED',
      message: `Syntax error; the SQL statement contains incorrect syntax.`
    }
  }

  if (isDefault) {
    return {
      success: true,
      mode: 'EXPLOITED',
      message: `valid Credentials`
    }
  }

  if (SQLi) {
    return {
      success: false,
      mode: 'EXPLOITED',
      message: `Syntax error; the SQL statement contains incorrect syntax`
    };
  }

  if (userExist) {
    return {
      success: false,
      mode: 'EXPLOITED',
      message: `Incorrect password`
    };
  }

  return {
    success: false,
    mode: 'REJECTED',
    message: 'Invalid Credentials'
  }
}