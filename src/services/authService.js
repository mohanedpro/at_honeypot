export const validateFakeCredentials = (username, password) => {

  const sqliPattern = /(union\s+select|or\s+1\s*=\s*1|--|\bselect\b|\binsert\b)/i

  if (sqliPattern.test(username) || sqliPattern.test(password)) {
    return {
      success: true,
      mode: 'EXPLOITED',
      message: 'Maintenance Mode: SQL debuge Bypass Active'
    };
  }

  return {
    success: false,
    mode: 'REJECTED',
    message: 'Invalid Credentials.'
  }
}